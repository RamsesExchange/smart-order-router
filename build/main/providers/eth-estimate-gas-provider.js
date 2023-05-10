"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EthEstimateGasSimulator = void 0;
const bignumber_1 = require("@ethersproject/bignumber");
const routers_1 = require("../routers");
const util_1 = require("../util");
const gas_factory_helpers_1 = require("../util/gas-factory-helpers");
const simulation_provider_1 = require("./simulation-provider");
class EthEstimateGasSimulator extends simulation_provider_1.Simulator {
    constructor(chainId, provider, v2PoolProvider, v3PoolProvider) {
        super(provider, chainId);
        this.v2PoolProvider = v2PoolProvider;
        this.v3PoolProvider = v3PoolProvider;
    }
    async ethEstimateGas(fromAddress, swapOptions, route, l2GasData) {
        const currencyIn = route.trade.inputAmount.currency;
        let estimatedGasUsed;
        if (swapOptions.type == routers_1.SwapType.UNIVERSAL_ROUTER) {
            util_1.log.info({ methodParameters: route.methodParameters }, 'Simulating using eth_estimateGas on Universal Router');
            try {
                estimatedGasUsed = await this.provider.estimateGas({
                    data: route.methodParameters.calldata,
                    to: route.methodParameters.to,
                    from: fromAddress,
                    value: bignumber_1.BigNumber.from(currencyIn.isNative ? route.methodParameters.value : '0'),
                });
            }
            catch (e) {
                util_1.log.error({ e }, 'Error estimating gas');
                return Object.assign(Object.assign({}, route), { simulationStatus: simulation_provider_1.SimulationStatus.Failed });
            }
        }
        else if (swapOptions.type == routers_1.SwapType.SWAP_ROUTER_02) {
            util_1.log.info({ methodParameters: route.methodParameters }, 'Simulating using eth_estimateGas on SwapRouter02');
            try {
                estimatedGasUsed = await this.provider.estimateGas({
                    data: route.methodParameters.calldata,
                    to: route.methodParameters.to,
                    from: fromAddress,
                    value: bignumber_1.BigNumber.from(currencyIn.isNative ? route.methodParameters.value : '0'),
                });
            }
            catch (e) {
                util_1.log.error({ e }, 'Error estimating gas');
                return Object.assign(Object.assign({}, route), { simulationStatus: simulation_provider_1.SimulationStatus.Failed });
            }
        }
        else {
            throw new Error(`Unsupported swap type ${swapOptions}`);
        }
        estimatedGasUsed = this.inflateGasLimit(estimatedGasUsed);
        const { estimatedGasUsedUSD, estimatedGasUsedQuoteToken, quoteGasAdjusted, } = await (0, gas_factory_helpers_1.calculateGasUsed)(route.quote.currency.chainId, route, estimatedGasUsed, this.v2PoolProvider, this.v3PoolProvider, l2GasData);
        return Object.assign(Object.assign({}, (0, gas_factory_helpers_1.initSwapRouteFromExisting)(route, this.v2PoolProvider, this.v3PoolProvider, quoteGasAdjusted, estimatedGasUsed, estimatedGasUsedQuoteToken, estimatedGasUsedUSD)), { simulationStatus: simulation_provider_1.SimulationStatus.Succeeded });
    }
    inflateGasLimit(gasLimit) {
        // multiply by 1.2
        return gasLimit.add(gasLimit.div(5));
    }
    async simulateTransaction(fromAddress, swapOptions, swapRoute, l2GasData, 
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _providerConfig) {
        const inputAmount = swapRoute.trade.inputAmount;
        if (inputAmount.currency.isNative ||
            (await this.checkTokenApproved(fromAddress, inputAmount, swapOptions, this.provider))) {
            return await this.ethEstimateGas(fromAddress, swapOptions, swapRoute, l2GasData);
        }
        else {
            util_1.log.info('Token not approved, skipping simulation');
            return Object.assign(Object.assign({}, swapRoute), { simulationStatus: simulation_provider_1.SimulationStatus.NotApproved });
        }
    }
}
exports.EthEstimateGasSimulator = EthEstimateGasSimulator;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXRoLWVzdGltYXRlLWdhcy1wcm92aWRlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9wcm92aWRlcnMvZXRoLWVzdGltYXRlLWdhcy1wcm92aWRlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQSx3REFBcUQ7QUFHckQsd0NBQThEO0FBQzlELGtDQUF1QztBQUN2QyxxRUFHcUM7QUFHckMsK0RBQW9FO0FBS3BFLE1BQWEsdUJBQXdCLFNBQVEsK0JBQVM7SUFHcEQsWUFDRSxPQUFnQixFQUNoQixRQUF5QixFQUN6QixjQUErQixFQUMvQixjQUErQjtRQUUvQixLQUFLLENBQUMsUUFBUSxFQUFFLE9BQU8sQ0FBQyxDQUFDO1FBQ3pCLElBQUksQ0FBQyxjQUFjLEdBQUcsY0FBYyxDQUFDO1FBQ3JDLElBQUksQ0FBQyxjQUFjLEdBQUcsY0FBYyxDQUFDO0lBQ3ZDLENBQUM7SUFDRCxLQUFLLENBQUMsY0FBYyxDQUNsQixXQUFtQixFQUNuQixXQUF3QixFQUN4QixLQUFnQixFQUNoQixTQUE2QztRQUU3QyxNQUFNLFVBQVUsR0FBRyxLQUFLLENBQUMsS0FBSyxDQUFDLFdBQVcsQ0FBQyxRQUFRLENBQUM7UUFDcEQsSUFBSSxnQkFBMkIsQ0FBQztRQUNoQyxJQUFJLFdBQVcsQ0FBQyxJQUFJLElBQUksa0JBQVEsQ0FBQyxnQkFBZ0IsRUFBRTtZQUNqRCxVQUFHLENBQUMsSUFBSSxDQUNOLEVBQUUsZ0JBQWdCLEVBQUUsS0FBSyxDQUFDLGdCQUFnQixFQUFFLEVBQzVDLHNEQUFzRCxDQUN2RCxDQUFDO1lBQ0YsSUFBSTtnQkFDRixnQkFBZ0IsR0FBRyxNQUFNLElBQUksQ0FBQyxRQUFRLENBQUMsV0FBVyxDQUFDO29CQUNqRCxJQUFJLEVBQUUsS0FBSyxDQUFDLGdCQUFpQixDQUFDLFFBQVE7b0JBQ3RDLEVBQUUsRUFBRSxLQUFLLENBQUMsZ0JBQWlCLENBQUMsRUFBRTtvQkFDOUIsSUFBSSxFQUFFLFdBQVc7b0JB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