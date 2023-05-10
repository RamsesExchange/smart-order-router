"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IRouteCachingProvider = void 0;
const sdk_core_1 = require("@uniswap/sdk-core");
const model_1 = require("./model");
/**
 * Abstract class for a RouteCachingProvider.
 * Defines the base methods of how to interact with this interface, but not the implementation of how to cache.
 */
class IRouteCachingProvider {
    constructor() {
        /**
         * Final implementation of the public `getCachedRoute` method, this is how code will interact with the implementation
         *
         * @public
         * @readonly
         * @param chainId
         * @param amount
         * @param quoteToken
         * @param tradeType
         * @param protocols
         * @param blockNumber
         */
        this.getCachedRoute = async (// Defined as a readonly member instead of a regular function to make it final.
        chainId, amount, quoteToken, tradeType, protocols, blockNumber) => {
            if (await this.getCacheMode(chainId, amount, quoteToken, tradeType, protocols) == model_1.CacheMode.Darkmode) {
                return undefined;
            }
            const cachedRoute = await this._getCachedRoute(chainId, amount, quoteToken, tradeType, protocols);
            return this.filterExpiredCachedRoutes(cachedRoute, blockNumber);
        };
        /**
         * Final implementation of the public `setCachedRoute` method.
         * This method will set the blockToLive in the CachedRoutes object before calling the internal method to insert in cache.
         *
         * @public
         * @readonly
         * @param cachedRoutes The route to cache.
         * @returns Promise<boolean> Indicates if the route was inserted into cache.
         */
        this.setCachedRoute = async (// Defined as a readonly member instead of a regular function to make it final.
        cachedRoutes, amount) => {
            if (await this.getCacheModeFromCachedRoutes(cachedRoutes, amount) == model_1.CacheMode.Darkmode) {
                return false;
            }
            cachedRoutes.blocksToLive = await this._getBlocksToLive(cachedRoutes, amount);
            return this._setCachedRoute(cachedRoutes, amount);
        };
    }
    /**
     * Returns the CacheMode for the given cachedRoutes and amount
     *
     * @param cachedRoutes
     * @param amount
     */
    getCacheModeFromCachedRoutes(cachedRoutes, amount) {
        const quoteToken = cachedRoutes.tradeType == sdk_core_1.TradeType.EXACT_INPUT ? cachedRoutes.tokenOut : cachedRoutes.tokenIn;
        return this.getCacheMode(cachedRoutes.chainId, amount, quoteToken, cachedRoutes.tradeType, cachedRoutes.protocolsCovered);
    }
    filterExpiredCachedRoutes(cachedRoutes, blockNumber) {
        return (cachedRoutes === null || cachedRoutes === void 0 ? void 0 : cachedRoutes.notExpired(blockNumber)) ? cachedRoutes : undefined;
    }
}
exports.IRouteCachingProvider = IRouteCachingProvider;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm91dGUtY2FjaGluZy1wcm92aWRlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uL3NyYy9wcm92aWRlcnMvY2FjaGluZy9yb3V0ZS9yb3V0ZS1jYWNoaW5nLXByb3ZpZGVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQU9BLGdEQUErRTtBQUkvRSxtQ0FBb0M7QUFHcEM7OztHQUdHO0FBQ0gsTUFBc0IscUJBQXFCO0lBQTNDO1FBQ0U7Ozs7Ozs7Ozs7O1dBV0c7UUFDYSxtQkFBYyxHQUFHLEtBQUssRUFBRywrRUFBK0U7UUFDdEgsT0FBZSxFQUNmLE1BQWdDLEVBQ2hDLFVBQWlCLEVBQ2pCLFNBQW9CLEVBQ3BCLFNBQXFCLEVBQ3JCLFdBQW1CLEVBQ2dCLEVBQUU7WUFDckMsSUFBSSxNQUFNLElBQUksQ0FBQyxZQUFZLENBQUMsT0FBTyxFQUFFLE1BQU0sRUFBRSxVQUFVLEVBQUUsU0FBUyxFQUFFLFNBQVMsQ0FBQyxJQUFJLGlCQUFTLENBQUMsUUFBUSxFQUFFO2dCQUNwRyxPQUFPLFNBQVMsQ0FBQzthQUNsQjtZQUVELE1BQU0sV0FBVyxHQUFHLE1BQU0sSUFBSSxDQUFDLGVBQWUsQ0FBQyxPQUFPLEVBQUUsTUFBTSxFQUFFLFVBQVUsRUFBRSxTQUFTLEVBQUUsU0FBUyxDQUFDLENBQUM7WUFFbEcsT0FBTyxJQUFJLENBQUMseUJBQXlCLENBQUMsV0FBVyxFQUFFLFdBQVcsQ0FBQyxDQUFDO1FBQ2xFLENBQUMsQ0FBQztRQUVGOzs7Ozs7OztXQVFHO1FBQ2EsbUJBQWMsR0FBRyxLQUFLLEVBQUcsK0VBQStFO1FBQ3RILFlBQTBCLEVBQzFCLE1BQWdDLEVBQ2QsRUFBRTtZQUNwQixJQUFJLE1BQU0sSUFBSSxDQUFDLDRCQUE0QixDQUFDLFlBQVksRUFBRSxNQUFNLENBQUMsSUFBSSxpQkFBUyxDQUFDLFFBQVEsRUFBRTtnQkFDdkYsT0FBTyxLQUFLLENBQUM7YUFDZDtZQUVELFlBQVksQ0FBQyxZQUFZLEdBQUcsTUFBTSxJQUFJLENBQUMsZ0JBQWdCLENBQUMsWUFBWSxFQUFFLE1BQU0sQ0FBQyxDQUFDO1lBRTlFLE9BQU8sSUFBSSxDQUFDLGVBQWUsQ0FBQyxZQUFZLEVBQUUsTUFBTSxDQUFDLENBQUM7UUFDcEQsQ0FBQyxDQUFDO0lBd0ZKLENBQUM7SUF0RkM7Ozs7O09BS0c7SUFDSSw0QkFBNEIsQ0FDakMsWUFBMEIsRUFDMUIsTUFBZ0M7UUFFaEMsTUFBTSxVQUFVLEdBQUcsWUFBWSxDQUFDLFNBQVMsSUFBSSxvQkFBUyxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUMsWUFBWSxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsWUFBWSxDQUFDLE9BQU8sQ0FBQztRQUVsSCxPQUFPLElBQUksQ0FBQyxZQUFZLENBQ3RCLFlBQVksQ0FBQyxPQUFPLEVBQ3BCLE1BQU0sRUFDTixVQUFVLEVBQ1YsWUFBWSxDQUFDLFNBQVMsRUFDdEIsWUFBWSxDQUFDLGdCQUFnQixDQUM5QixDQUFDO0lBQ0osQ0FBQztJQXFCTyx5QkFBeUIsQ0FDL0IsWUFBc0MsRUFDdEMsV0FBbUI7UUFFbkIsT0FBTyxDQUFBLFlBQVksYUFBWixZQUFZLHVCQUFaLFlBQVksQ0FBRSxVQUFVLENBQUMsV0FBVyxDQUFDLEVBQUMsQ0FBQyxDQUFDLFlBQVksQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDO0lBQzFFLENBQUM7Q0F5Q0Y7QUExSUQsc0RBMElDIn0=