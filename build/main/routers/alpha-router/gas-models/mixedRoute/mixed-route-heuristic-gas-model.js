"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MixedRouteHeuristicGasModelFactory = void 0;
const bignumber_1 = require("@ethersproject/bignumber");
const router_sdk_1 = require("@uniswap/router-sdk");
const v2_sdk_1 = require("@uniswap/v2-sdk");
const v3_sdk_1 = require("@uniswap/v3-sdk");
const jsbi_1 = __importDefault(require("jsbi"));
const lodash_1 = __importDefault(require("lodash"));
const __1 = require("../../../..");
const util_1 = require("../../../../util");
const amounts_1 = require("../../../../util/amounts");
const gas_factory_helpers_1 = require("../../../../util/gas-factory-helpers");
const gas_model_1 = require("../gas-model");
const v2_heuristic_gas_model_1 = require("../v2/v2-heuristic-gas-model");
const gas_costs_1 = require("../v3/gas-costs");
/**
 * Computes a gas estimate for a mixed route swap using heuristics.
 * Considers number of hops in the route, number of ticks crossed
 * and the typical base cost for a swap.
 *
 * We get the number of ticks crossed in a swap from the MixedRouteQuoterV1
 * contract.
 *
 * We compute gas estimates off-chain because
 *  1/ Calling eth_estimateGas for a swaps requires the caller to have
 *     the full balance token being swapped, and approvals.
 *  2/ Tracking gas used using a wrapper contract is not accurate with Multicall
 *     due to EIP-2929. We would have to make a request for every swap we wanted to estimate.
 *  3/ For V2 we simulate all our swaps off-chain so have no way to track gas used.
 *
 * @export
 * @class MixedRouteHeuristicGasModelFactory
 */
class MixedRouteHeuristicGasModelFactory extends gas_model_1.IOnChainGasModelFactory {
    constructor() {
        super();
    }
    async buildGasModel({ chainId, gasPriceWei, v3poolProvider: V3poolProvider, quoteToken, v2poolProvider: V2poolProvider, }) {
        const usdPool = await (0, gas_factory_helpers_1.getHighestLiquidityV3USDPool)(chainId, V3poolProvider);
        // If our quote token is WETH, we don't need to convert our gas use to be in terms
        // of the quote token in order to produce a gas adjusted amount.
        // We do return a gas use in USD however, so we still convert to usd.
        const nativeCurrency = __1.WRAPPED_NATIVE_CURRENCY[chainId];
        if (quoteToken.equals(nativeCurrency)) {
            const estimateGasCost = (routeWithValidQuote) => {
                const { totalGasCostNativeCurrency, baseGasUse } = this.estimateGas(routeWithValidQuote, gasPriceWei, chainId);
                const token0 = usdPool.token0.address == nativeCurrency.address;
                const nativeTokenPrice = token0
                    ? usdPool.token0Price
                    : usdPool.token1Price;
                const gasCostInTermsOfUSD = nativeTokenPrice.quote(totalGasCostNativeCurrency);
                return {
                    gasEstimate: baseGasUse,
                    gasCostInToken: totalGasCostNativeCurrency,
                    gasCostInUSD: gasCostInTermsOfUSD,
                };
            };
            return {
                estimateGasCost,
            };
        }
        // If the quote token is not in the native currency, we convert the gas cost to be in terms of the quote token.
        // We do this by getting the highest liquidity <quoteToken>/<nativeCurrency> pool. eg. <quoteToken>/ETH pool.
        const nativeV3Pool = await (0, gas_factory_helpers_1.getHighestLiquidityV3NativePool)(quoteToken, V3poolProvider);
        let nativeV2Pool;
        // if (V2poolProvider) {       // TODO: mixed routes
        // eslint-disable-next-line no-constant-condition
        if (false) {
            /// MixedRoutes
            nativeV2Pool = await (0, gas_factory_helpers_1.getV2NativePool)(quoteToken, V2poolProvider);
        }
        const usdToken = usdPool.token0.address == nativeCurrency.address
            ? usdPool.token1
            : usdPool.token0;
        const estimateGasCost = (routeWithValidQuote) => {
            const { totalGasCostNativeCurrency, baseGasUse } = this.estimateGas(routeWithValidQuote, gasPriceWei, chainId);
            if (!nativeV3Pool && !nativeV2Pool) {
                util_1.log.info(`Unable to find ${nativeCurrency.symbol} pool with the quote token, ${quoteToken.symbol} to produce gas adjusted costs. Route will not account for gas.`);
                return {
                    gasEstimate: baseGasUse,
                    gasCostInToken: amounts_1.CurrencyAmount.fromRawAmount(quoteToken, 0),
                    gasCostInUSD: amounts_1.CurrencyAmount.fromRawAmount(usdToken, 0),
                };
            }
            /// we will use nativeV2Pool for fallback if nativeV3 does not exist or has 0 liquidity
            /// can use ! here because we return above if v3Pool and v2Pool are null
            const nativePool = (!nativeV3Pool || jsbi_1.default.equal(nativeV3Pool.liquidity, jsbi_1.default.BigInt(0))) &&
                nativeV2Pool
                ? nativeV2Pool
                : nativeV3Pool;
            const token0 = nativePool.token0.address == nativeCurrency.address;
            // returns mid price in terms of the native currency (the ratio of quoteToken/nativeToken)
            const nativeTokenPrice = token0
                ? nativePool.token0Price
                : nativePool.token1Price;
            let gasCostInTermsOfQuoteToken;
            try {
                // native token is base currency
                gasCostInTermsOfQuoteToken = nativeTokenPrice.quote(totalGasCostNativeCurrency);
            }
            catch (err) {
                util_1.log.info({
                    nativeTokenPriceBase: nativeTokenPrice.baseCurrency,
                    nativeTokenPriceQuote: nativeTokenPrice.quoteCurrency,
                    gasCostInEth: totalGasCostNativeCurrency.currency,
                }, 'Debug eth price token issue');
                throw err;
            }
            // true if token0 is the native currency
            const token0USDPool = usdPool.token0.address == nativeCurrency.address;
            // gets the mid price of the pool in terms of the native token
            const nativeTokenPriceUSDPool = token0USDPool
                ? usdPool.token0Price
                : usdPool.token1Price;
            let gasCostInTermsOfUSD;
            try {
                gasCostInTermsOfUSD = nativeTokenPriceUSDPool.quote(totalGasCostNativeCurrency);
            }
            catch (err) {
                util_1.log.info({
                    usdT1: usdPool.token0.symbol,
                    usdT2: usdPool.token1.symbol,
                    gasCostInNativeToken: totalGasCostNativeCurrency.currency.symbol,
                }, 'Failed to compute USD gas price');
                throw err;
            }
            return {
                gasEstimate: baseGasUse,
                gasCostInToken: gasCostInTermsOfQuoteToken,
                gasCostInUSD: gasCostInTermsOfUSD,
            };
        };
        return {
            estimateGasCost: estimateGasCost.bind(this),
        };
    }
    estimateGas(routeWithValidQuote, gasPriceWei, chainId) {
        const totalInitializedTicksCrossed = bignumber_1.BigNumber.from(Math.max(1, lodash_1.default.sum(routeWithValidQuote.initializedTicksCrossedList)));
        /**
         * Since we must make a separate call to multicall for each v3 and v2 section, we will have to
         * add the BASE_SWAP_COST to each section.
         */
        let baseGasUse = bignumber_1.BigNumber.from(0);
        const route = routeWithValidQuote.route;
        const res = (0, router_sdk_1.partitionMixedRouteByProtocol)(route);
        res.map((section) => {
            if (section.every((pool) => pool instanceof v3_sdk_1.Pool)) {
                baseGasUse = baseGasUse.add((0, gas_costs_1.BASE_SWAP_COST)(chainId));
                baseGasUse = baseGasUse.add((0, gas_costs_1.COST_PER_HOP)(chainId).mul(section.length));
            }
            else if (section.every((pool) => pool instanceof v2_sdk_1.Pair)) {
                baseGasUse = baseGasUse.add(v2_heuristic_gas_model_1.BASE_SWAP_COST);
                baseGasUse = baseGasUse.add(
                /// same behavior in v2 heuristic gas model factory
                v2_heuristic_gas_model_1.COST_PER_EXTRA_HOP.mul(section.length - 1));
            }
        });
        const tickGasUse = (0, gas_costs_1.COST_PER_INIT_TICK)(chainId).mul(totalInitializedTicksCrossed);
        const uninitializedTickGasUse = gas_costs_1.COST_PER_UNINIT_TICK.mul(0);
        // base estimate gas used based on chainId estimates for hops and ticks gas useage
        baseGasUse = baseGasUse.add(tickGasUse).add(uninitializedTickGasUse);
        const baseGasCostWei = gasPriceWei.mul(baseGasUse);
        const wrappedCurrency = __1.WRAPPED_NATIVE_CURRENCY[chainId];
        const totalGasCostNativeCurrency = amounts_1.CurrencyAmount.fromRawAmount(wrappedCurrency, baseGasCostWei.toString());
        return {
            totalGasCostNativeCurrency,
            totalInitializedTicksCrossed,
            baseGasUse,
        };
    }
}
exports.MixedRouteHeuristicGasModelFactory = MixedRouteHeuristicGasModelFactory;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWl4ZWQtcm91dGUtaGV1cmlzdGljLWdhcy1tb2RlbC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uL3NyYy9yb3V0ZXJzL2FscGhhLXJvdXRlci9nYXMtbW9kZWxzL21peGVkUm91dGUvbWl4ZWQtcm91dGUtaGV1cmlzdGljLWdhcy1tb2RlbC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7QUFBQSx3REFBcUQ7QUFDckQsb0RBQW9FO0FBQ3BFLDRDQUF1QztBQUN2Qyw0Q0FBdUM7QUFDdkMsZ0RBQXdCO0FBQ3hCLG9EQUF1QjtBQUV2QixtQ0FBc0Q7QUFDdEQsMkNBQWdEO0FBQ2hELHNEQUEwRDtBQUMxRCw4RUFJOEM7QUFFOUMsNENBSXNCO0FBQ3RCLHlFQUdzQztBQUN0QywrQ0FLeUI7QUFFekI7Ozs7Ozs7Ozs7Ozs7Ozs7O0dBaUJHO0FBQ0gsTUFBYSxrQ0FBbUMsU0FBUSxtQ0FBdUI7SUFDN0U7UUFDRSxLQUFLLEVBQUUsQ0FBQztJQUNWLENBQUM7SUFFTSxLQUFLLENBQUMsYUFBYSxDQUFDLEVBQ3pCLE9BQU8sRUFDUCxXQUFXLEVBQ1gsY0FBYyxFQUFFLGNBQWMsRUFDOUIsVUFBVSxFQUNWLGNBQWMsRUFBRSxjQUFjLEdBQ0U7UUFHaEMsTUFBTSxPQUFPLEdBQVMsTUFBTSxJQUFBLGtEQUE0QixFQUN0RCxPQUFPLEVBQ1AsY0FBYyxDQUNmLENBQUM7UUFFRixrRkFBa0Y7UUFDbEYsZ0VBQWdFO1FBQ2hFLHFFQUFxRTtRQUNyRSxNQUFNLGNBQWMsR0FBRywyQkFBdUIsQ0FBQyxPQUFPLENBQUUsQ0FBQztRQUN6RCxJQUFJLFVBQVUsQ0FBQyxNQUFNLENBQUMsY0FBYyxDQUFDLEVBQUU7WUFDckMsTUFBTSxlQUFlLEdBQUcsQ0FDdEIsbUJBQTZDLEVBSzdDLEVBQUU7Z0JBQ0YsTUFBTSxFQUFFLDBCQUEwQixFQUFFLFVBQVUsRUFBRSxHQUFHLElBQUksQ0FBQyxXQUFXLENBQ2pFLG1CQUFtQixFQUNuQixXQUFXLEVBQ1gsT0FBTyxDQUNSLENBQUM7Z0JBRUYsTUFBTSxNQUFNLEdBQUcsT0FBTyxDQUFDLE1BQU0sQ0FBQyxPQUFPLElBQUksY0FBYyxDQUFDLE9BQU8sQ0FBQztnQkFFaEUsTUFBTSxnQkFBZ0IsR0FBRyxNQUFNO29CQUM3QixDQUFDLENBQUMsT0FBTyxDQUFDLFdBQVc7b0JBQ3JCLENBQUMsQ0FBQyxPQUFPLENBQUMsV0FBVyxDQUFDO2dCQUV4QixNQUFNLG1CQUFtQixHQUFtQixnQkFBZ0IsQ0FBQyxLQUFLLENBQ2hFLDBCQUEwQixDQUNULENBQUM7Z0JBRXBCLE9BQU87b0JBQ0wsV0FBVyxFQUFFLFVBQVU7b0JBQ3ZCLGNBQWMsRUFBRSwwQkFBMEI7b0JBQzFDLFlBQVksRUFBRSxtQkFBbUI7aUJBQ2xDLENBQUM7WUFDSixDQUFDLENBQUM7WUFFRixPQUFPO2dCQUNMLGVBQWU7YUFDaEIsQ0FBQztTQUNIO1FBRUQsK0dBQStHO1FBQy9HLDZHQUE2RztRQUM3RyxNQUFNLFlBQVksR0FBZ0IsTUFBTSxJQUFBLHFEQUErQixFQUNyRSxVQUFVLEVBQ1YsY0FBYyxDQUNmLENBQUM7UUFFRixJQUFJLFlBQXlCLENBQUM7UUFDOUIsb0RBQW9EO1FBQ3BELGlEQUFpRDtRQUNqRCxJQUFJLEtBQUssRUFBRTtZQUNULGVBQWU7WUFDZixZQUFZLEdBQUcsTUFBTSxJQUFBLHFDQUFlLEVBQUMsVUFBVSxFQUFFLGNBQWMsQ0FBQyxDQUFDO1NBQ2xFO1FBRUQsTUFBTSxRQUFRLEdBQ1osT0FBTyxDQUFDLE1BQU0sQ0FBQyxPQUFPLElBQUksY0FBYyxDQUFDLE9BQU87WUFDOUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxNQUFNO1lBQ2hCLENBQUMsQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDO1FBRXJCLE1BQU0sZUFBZSxHQUFHLENBQ3RCLG1CQUE2QyxFQUs3QyxFQUFFO1lBQ0YsTUFBTSxFQUFFLDBCQUEwQixFQUFFLFVBQVUsRUFBRSxHQUFHLElBQUksQ0FBQyxXQUFXLENBQ2pFLG1CQUFtQixFQUNuQixXQUFXLEVBQ1gsT0FBTyxDQUNSLENBQUM7WUFFRixJQUFJLENBQUMsWUFBWSxJQUFJLENBQUMsWUFBWSxFQUFFO2dCQUNsQyxVQUFHLENBQUMsSUFBSSxDQUNOLGtCQUFrQixjQUFjLENBQUMsTUFBTSwrQkFBK0IsVUFBVSxDQUFDLE1BQU0saUVBQWlFLENBQ3pKLENBQUM7Z0JBQ0YsT0FBTztvQkFDTCxXQUFXLEVBQUUsVUFBVTtvQkFDdkIsY0FBYyxFQUFFLHdCQUFjLENBQUMsYUFBYSxDQUFDLFVBQVUsRUFBRSxDQUFDLENBQUM7b0JBQzNELFlBQVksRUFBRSx3QkFBYyxDQUFDLGFBQWEsQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFDO2lCQUN4RCxDQUFDO2FBQ0g7WUFFRCx1RkFBdUY7WUFDdkYsd0VBQXdFO1lBQ3hFLE1BQU0sVUFBVSxHQUNkLENBQUMsQ0FBQyxZQUFZLElBQUksY0FBSSxDQUFDLEtBQUssQ0FBQyxZQUFZLENBQUMsU0FBUyxFQUFFLGNBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDckUsWUFBWTtnQkFDVixDQUFDLENBQUMsWUFBWTtnQkFDZCxDQUFDLENBQUMsWUFBYSxDQUFDO1lBRXBCLE1BQU0sTUFBTSxHQUFHLFVBQVUsQ0FBQyxNQUFNLENBQUMsT0FBTyxJQUFJLGNBQWMsQ0FBQyxPQUFPLENBQUM7WUFFbkUsMEZBQTBGO1lBQzFGLE1BQU0sZ0JBQWdCLEdBQUcsTUFBTTtnQkFDN0IsQ0FBQyxDQUFDLFVBQVUsQ0FBQyxXQUFXO2dCQUN4QixDQUFDLENBQUMsVUFBVSxDQUFDLFdBQVcsQ0FBQztZQUUzQixJQUFJLDBCQUEwQyxDQUFDO1lBQy9DLElBQUk7Z0JBQ0YsZ0NBQWdDO2dCQUNoQywwQkFBMEIsR0FBRyxnQkFBZ0IsQ0FBQyxLQUFLLENBQ2pELDBCQUEwQixDQUNULENBQUM7YUFDckI7WUFBQyxPQUFPLEdBQUcsRUFBRTtnQkFDWixVQUFHLENBQUMsSUFBSSxDQUNOO29CQUNFLG9CQUFvQixFQUFFLGdCQUFnQixDQUFDLFlBQVk7b0JBQ25ELHFCQUFxQixFQUFFLGdCQUFnQixDQUFDLGFBQWE7b0JBQ3JELFlBQVksRUFBRSwwQkFBMEIsQ0FBQyxRQUFRO2lCQUNsRCxFQUNELDZCQUE2QixDQUM5QixDQUFDO2dCQUNGLE1BQU0sR0FBRyxDQUFDO2FBQ1g7WUFFRCx3Q0FBd0M7WUFDeEMsTUFBTSxhQUFhLEdBQUcsT0FBTyxDQUFDLE1BQU0sQ0FBQyxPQUFPLElBQUksY0FBYyxDQUFDLE9BQU8sQ0FBQztZQUV2RSw4REFBOEQ7WUFDOUQsTUFBTSx1QkFBdUIsR0FBRyxhQUFhO2dCQUMzQyxDQUFDLENBQUMsT0FBTyxDQUFDLFdBQVc7Z0JBQ3JCLENBQUMsQ0FBQyxPQUFPLENBQUMsV0FBVyxDQUFDO1lBRXhCLElBQUksbUJBQW1DLENBQUM7WUFDeEMsSUFBSTtnQkFDRixtQkFBbUIsR0FBRyx1QkFBdUIsQ0FBQyxLQUFLLENBQ2pELDBCQUEwQixDQUNULENBQUM7YUFDckI7WUFBQyxPQUFPLEdBQUcsRUFBRTtnQkFDWixVQUFHLENBQUMsSUFBSSxDQUNOO29CQUNFLEtBQUssRUFBRSxPQUFPLENBQUMsTUFBTSxDQUFDLE1BQU07b0JBQzVCLEtBQUssRUFBRSxPQUFPLENBQUMsTUFBTSxDQUFDLE1BQU07b0JBQzVCLG9CQUFvQixFQUFFLDBCQUEwQixDQUFDLFFBQVEsQ0FBQyxNQUFNO2lCQUNqRSxFQUNELGlDQUFpQyxDQUNsQyxDQUFDO2dCQUNGLE1BQU0sR0FBRyxDQUFDO2FBQ1g7WUFFRCxPQUFPO2dCQUNMLFdBQVcsRUFBRSxVQUFVO2dCQUN2QixjQUFjLEVBQUUsMEJBQTBCO2dCQUMxQyxZQUFZLEVBQUUsbUJBQW9CO2FBQ25DLENBQUM7UUFDSixDQUFDLENBQUM7UUFFRixPQUFPO1lBQ0wsZUFBZSxFQUFFLGVBQWUsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDO1NBQzVDLENBQUM7SUFDSixDQUFDO0lBRU8sV0FBVyxDQUNqQixtQkFBNkMsRUFDN0MsV0FBc0IsRUFDdEIsT0FBZ0I7UUFFaEIsTUFBTSw0QkFBNEIsR0FBRyxxQkFBUyxDQUFDLElBQUksQ0FDakQsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLEVBQUUsZ0JBQUMsQ0FBQyxHQUFHLENBQUMsbUJBQW1CLENBQUMsMkJBQTJCLENBQUMsQ0FBQyxDQUNwRSxDQUFDO1FBQ0Y7OztXQUdHO1FBQ0gsSUFBSSxVQUFVLEdBQUcscUJBQVMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFFbkMsTUFBTSxLQUFLLEdBQUcsbUJBQW1CLENBQUMsS0FBSyxDQUFDO1FBRXhDLE1BQU0sR0FBRyxHQUFHLElBQUEsMENBQTZCLEVBQUMsS0FBSyxDQUFDLENBQUM7UUFDakQsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDLE9BQXdCLEVBQUUsRUFBRTtZQUNuQyxJQUFJLE9BQU8sQ0FBQyxLQUFLLENBQUMsQ0FBQyxJQUFJLEVBQUUsRUFBRSxDQUFDLElBQUksWUFBWSxhQUFJLENBQUMsRUFBRTtnQkFDakQsVUFBVSxHQUFHLFVBQVUsQ0FBQyxHQUFHLENBQUMsSUFBQSwwQkFBYyxFQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUM7Z0JBQ3JELFVBQVUsR0FBRyxVQUFVLENBQUMsR0FBRyxDQUFDLElBQUEsd0JBQVksRUFBQyxPQUFPLENBQUMsQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUM7YUFDeEU7aUJBQU0sSUFBSSxPQUFPLENBQUMsS0FBSyxDQUFDLENBQUMsSUFBSSxFQUFFLEVBQUUsQ0FBQyxJQUFJLFlBQVksYUFBSSxDQUFDLEVBQUU7Z0JBQ3hELFVBQVUsR0FBRyxVQUFVLENBQUMsR0FBRyxDQUFDLHVDQUFpQixDQUFDLENBQUM7Z0JBQy9DLFVBQVUsR0FBRyxVQUFVLENBQUMsR0FBRztnQkFDekIsbURBQW1EO2dCQUNuRCwyQ0FBcUIsQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUMsQ0FDOUMsQ0FBQzthQUNIO1FBQ0gsQ0FBQyxDQUFDLENBQUM7UUFFSCxNQUFNLFVBQVUsR0FBRyxJQUFBLDhCQUFrQixFQUFDLE9BQU8sQ0FBQyxDQUFDLEdBQUcsQ0FDaEQsNEJBQTRCLENBQzdCLENBQUM7UUFDRixNQUFNLHVCQUF1QixHQUFHLGdDQUFvQixDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUU1RCxrRkFBa0Y7UUFDbEYsVUFBVSxHQUFHLFVBQVUsQ0FBQyxHQUFHLENBQUMsVUFBVSxDQUFDLENBQUMsR0FBRyxDQUFDLHVCQUF1QixDQUFDLENBQUM7UUFFckUsTUFBTSxjQUFjLEdBQUcsV0FBVyxDQUFDLEdBQUcsQ0FBQyxVQUFVLENBQUMsQ0FBQztRQUVuRCxNQUFNLGVBQWUsR0FBRywyQkFBdUIsQ0FBQyxPQUFPLENBQUUsQ0FBQztRQUUxRCxNQUFNLDBCQUEwQixHQUFHLHdCQUFjLENBQUMsYUFBYSxDQUM3RCxlQUFlLEVBQ2YsY0FBYyxDQUFDLFFBQVEsRUFBRSxDQUMxQixDQUFDO1FBRUYsT0FBTztZQUNMLDBCQUEwQjtZQUMxQiw0QkFBNEI7WUFDNUIsVUFBVTtTQUNYLENBQUM7SUFDSixDQUFDO0NBQ0Y7QUFsT0QsZ0ZBa09DIn0=