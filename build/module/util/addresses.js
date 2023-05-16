import { Token } from '@uniswap/sdk-core';
import { FACTORY_ADDRESS } from '@uniswap/v3-sdk';
import { ChainId, NETWORKS_WITH_SAME_UNISWAP_ADDRESSES } from './chains';
const CELO_V3_CORE_FACTORY_ADDRESSES = '0xAfE208a311B21f13EF87E33A90049fC17A7acDEc';
const CELO_QUOTER_ADDRESSES = '0x82825d0554fA07f7FC52Ab63c961F330fdEFa8E8';
const CELO_MULTICALL_ADDRESS = '0x633987602DE5C4F337e3DbF265303A1080324204';
// Ramses v2 addresses
const RAMSES_V2_CORE_FACTORY_ADDRESSES = '0xAA2cd7477c451E703f3B9Ba5663334914763edF8';
const RAMSES_QUOTER_ADDRESSES = '0xAA20EFF7ad2F523590dE6c04918DaAE0904E3b20';
const RAMSES_NONFUNGIBLE_POSITION_MANAGER_ADDRESSES = '0xAA277CB7914b7e5514946Da92cb9De332Ce610EF';
const RAMSES_TICK_LENS_ADDRESSES = '0xAA22A15c56e0Dd62eaA30B8C1f9F3eE6D137CeeB';
// const RAMSES_UNIVERSAL_ROUTER_ADDRESS =
// '0xAA20E420FE4966c32614c495C45dEDeA92729734';
const RAMSES_SWAP_ROUTER_02_ADDRESS = '0xAA23611badAFB62D37E7295A682D21960ac85A90';
const RAMSES_V2_MIGRATOR_ADDRESS = '0xAA27816EFCd7Ad09f8d80E9027a222cCc017Fbc7';
export const RAMSES_POOL_INIT_CODE_HASH = '0x1565b129f2d1790f12d45301b9b084335626f0c92410bc43130763b69971135d';
const ARBITRUM_GOERLI_V3_CORE_FACTORY_ADDRESSES = '0x4893376342d5D7b3e31d4184c08b265e5aB2A3f6';
const ARBITRUM_GOERLI_QUOTER_ADDRESSES = '0x1dd92b83591781D0C6d98d07391eea4b9a6008FA';
const ARBITRUM_GOERLI_MULTICALL_ADDRESS = '0x8260CB40247290317a4c062F3542622367F206Ee';
const OPTIMISM_GOERLI_V3_CORE_FACTORY_ADDRESSES = '0xB656dA17129e7EB733A557f4EBc57B76CFbB5d10';
const OPTIMISM_GOERLI_QUOTER_ADDRESSES = '0x9569CbA925c8ca2248772A9A4976A516743A246F';
const OPTIMISM_GOERLI_MULTICALL_ADDRESS = '0x07F2D8a2a02251B62af965f22fC4744A5f96BCCd';
const BSC_V3_CORE_FACTORY_ADDRESSES = '0xdB1d10011AD0Ff90774D0C6Bb92e5C5c8b4461F7';
const BSC_QUOTER_ADDRESSES = '0x78D78E420Da98ad378D7799bE8f4AF69033EB077';
const BSC_MULTICALL_ADDRESS = '0x963Df249eD09c358A4819E39d9Cd5736c3087184';
export const BSC_TICK_LENS_ADDRESS = '0xD9270014D396281579760619CCf4c3af0501A47C';
export const BSC_NONFUNGIBLE_POSITION_MANAGER_ADDRESS = '0x7b8A01B39D58278b5DE7e48c8449c9f4F5170613';
export const BSC_SWAP_ROUTER_02_ADDRESS = '0xB971eF87ede563556b2ED4b1C0b0019111Dd85d2';
export const BSC_V3_MIGRATOR_ADDRESS = '0x32681814957e0C13117ddc0c2aba232b5c9e760f';
export const V3_CORE_FACTORY_ADDRESSES = {
    ...constructSameAddressMap(FACTORY_ADDRESS),
    [ChainId.ARBITRUM_ONE]: RAMSES_V2_CORE_FACTORY_ADDRESSES,
    [ChainId.CELO]: CELO_V3_CORE_FACTORY_ADDRESSES,
    [ChainId.CELO_ALFAJORES]: CELO_V3_CORE_FACTORY_ADDRESSES,
    [ChainId.OPTIMISM_GOERLI]: OPTIMISM_GOERLI_V3_CORE_FACTORY_ADDRESSES,
    [ChainId.ARBITRUM_GOERLI]: ARBITRUM_GOERLI_V3_CORE_FACTORY_ADDRESSES,
    [ChainId.BSC]: BSC_V3_CORE_FACTORY_ADDRESSES,
    // TODO: Gnosis + Moonbeam contracts to be deployed
};
export const QUOTER_V2_ADDRESSES = {
    ...constructSameAddressMap('0x61fFE014bA17989E743c5F6cB21bF9697530B21e'),
    [ChainId.ARBITRUM_ONE]: RAMSES_QUOTER_ADDRESSES,
    [ChainId.CELO]: CELO_QUOTER_ADDRESSES,
    [ChainId.CELO_ALFAJORES]: CELO_QUOTER_ADDRESSES,
    [ChainId.OPTIMISM_GOERLI]: OPTIMISM_GOERLI_QUOTER_ADDRESSES,
    [ChainId.ARBITRUM_GOERLI]: ARBITRUM_GOERLI_QUOTER_ADDRESSES,
    [ChainId.BSC]: BSC_QUOTER_ADDRESSES,
    // TODO: Gnosis + Moonbeam contracts to be deployed
};
export const MIXED_ROUTE_QUOTER_V1_ADDRESSES = {
    [ChainId.MAINNET]: '0x84E44095eeBfEC7793Cd7d5b57B7e401D7f1cA2E',
    [ChainId.RINKEBY]: '0x84E44095eeBfEC7793Cd7d5b57B7e401D7f1cA2E',
    [ChainId.ROPSTEN]: '0x84E44095eeBfEC7793Cd7d5b57B7e401D7f1cA2E',
    [ChainId.GÖRLI]: '0xBa60b6e6fF25488308789E6e0A65D838be34194e',
};
export const UNISWAP_MULTICALL_ADDRESSES = {
    ...constructSameAddressMap('0x1F98415757620B543A52E61c46B32eB19261F984'),
    [ChainId.CELO]: CELO_MULTICALL_ADDRESS,
    [ChainId.CELO_ALFAJORES]: CELO_MULTICALL_ADDRESS,
    [ChainId.OPTIMISM_GOERLI]: OPTIMISM_GOERLI_MULTICALL_ADDRESS,
    [ChainId.ARBITRUM_GOERLI]: ARBITRUM_GOERLI_MULTICALL_ADDRESS,
    [ChainId.BSC]: BSC_MULTICALL_ADDRESS,
    // TODO: Gnosis + Moonbeam contracts to be deployed
};
export const SWAP_ROUTER_02_ADDRESSES = (chainId) => {
    if (chainId == ChainId.ARBITRUM_ONE) {
        return RAMSES_SWAP_ROUTER_02_ADDRESS;
    }
    if (chainId == ChainId.BSC) {
        return BSC_SWAP_ROUTER_02_ADDRESS;
    }
    return '0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45';
};
export const OVM_GASPRICE_ADDRESS = '0x420000000000000000000000000000000000000F';
export const ARB_GASINFO_ADDRESS = '0x000000000000000000000000000000000000006C';
export const TICK_LENS_ADDRESS = RAMSES_TICK_LENS_ADDRESSES;
export const NONFUNGIBLE_POSITION_MANAGER_ADDRESS = RAMSES_NONFUNGIBLE_POSITION_MANAGER_ADDRESSES;
export const V3_MIGRATOR_ADDRESS = RAMSES_V2_MIGRATOR_ADDRESS;
export const MULTICALL2_ADDRESS = '0x1F98415757620B543A52E61c46B32eB19261F984';
export function constructSameAddressMap(address, additionalNetworks = []) {
    return NETWORKS_WITH_SAME_UNISWAP_ADDRESSES.concat(additionalNetworks).reduce((memo, chainId) => {
        memo[chainId] = address;
        return memo;
    }, {});
}
export const WETH9 = {
    [ChainId.MAINNET]: new Token(ChainId.MAINNET, '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', 18, 'WETH', 'Wrapped Ether'),
    [ChainId.ROPSTEN]: new Token(ChainId.ROPSTEN, '0xc778417E063141139Fce010982780140Aa0cD5Ab', 18, 'WETH', 'Wrapped Ether'),
    [ChainId.RINKEBY]: new Token(ChainId.RINKEBY, '0xc778417E063141139Fce010982780140Aa0cD5Ab', 18, 'WETH', 'Wrapped Ether'),
    [ChainId.GÖRLI]: new Token(ChainId.GÖRLI, '0xB4FBF271143F4FBf7B91A5ded31805e42b2208d6', 18, 'WETH', 'Wrapped Ether'),
    [ChainId.KOVAN]: new Token(ChainId.KOVAN, '0xd0A1E359811322d97991E03f863a0C30C2cF029C', 18, 'WETH', 'Wrapped Ether'),
    [ChainId.OPTIMISM]: new Token(ChainId.OPTIMISM, '0x4200000000000000000000000000000000000006', 18, 'WETH', 'Wrapped Ether'),
    [ChainId.OPTIMISM_GOERLI]: new Token(ChainId.OPTIMISM_GOERLI, '0x4200000000000000000000000000000000000006', 18, 'WETH', 'Wrapped Ether'),
    [ChainId.OPTIMISTIC_KOVAN]: new Token(ChainId.OPTIMISTIC_KOVAN, '0x4200000000000000000000000000000000000006', 18, 'WETH', 'Wrapped Ether'),
    [ChainId.ARBITRUM_ONE]: new Token(ChainId.ARBITRUM_ONE, '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1', 18, 'WETH', 'Wrapped Ether'),
    [ChainId.ARBITRUM_RINKEBY]: new Token(ChainId.ARBITRUM_RINKEBY, '0xB47e6A5f8b33b3F17603C83a0535A9dcD7E32681', 18, 'WETH', 'Wrapped Ether'),
    [ChainId.ARBITRUM_GOERLI]: new Token(ChainId.ARBITRUM_GOERLI, '0xe39Ab88f8A4777030A534146A9Ca3B52bd5D43A3', 18, 'WETH', 'Wrapped Ether'),
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYWRkcmVzc2VzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vc3JjL3V0aWwvYWRkcmVzc2VzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE9BQU8sRUFBRSxLQUFLLEVBQUUsTUFBTSxtQkFBbUIsQ0FBQztBQUMxQyxPQUFPLEVBQUUsZUFBZSxFQUFFLE1BQU0saUJBQWlCLENBQUM7QUFFbEQsT0FBTyxFQUFFLE9BQU8sRUFBRSxvQ0FBb0MsRUFBRSxNQUFNLFVBQVUsQ0FBQztBQUV6RSxNQUFNLDhCQUE4QixHQUNsQyw0Q0FBNEMsQ0FBQztBQUMvQyxNQUFNLHFCQUFxQixHQUFHLDRDQUE0QyxDQUFDO0FBQzNFLE1BQU0sc0JBQXNCLEdBQUcsNENBQTRDLENBQUM7QUFFNUUsc0JBQXNCO0FBQ3RCLE1BQU0sZ0NBQWdDLEdBQ3BDLDRDQUE0QyxDQUFDO0FBQy9DLE1BQU0sdUJBQXVCLEdBQUcsNENBQTRDLENBQUM7QUFDN0UsTUFBTSw2Q0FBNkMsR0FDakQsNENBQTRDLENBQUM7QUFDL0MsTUFBTSwwQkFBMEIsR0FBRyw0Q0FBNEMsQ0FBQztBQUNoRiwwQ0FBMEM7QUFDMUMsZ0RBQWdEO0FBQ2hELE1BQU0sNkJBQTZCLEdBQ2pDLDRDQUE0QyxDQUFDO0FBQy9DLE1BQU0sMEJBQTBCLEdBQUcsNENBQTRDLENBQUM7QUFDaEYsTUFBTSxDQUFDLE1BQU0sMEJBQTBCLEdBQ3JDLG9FQUFvRSxDQUFDO0FBRXZFLE1BQU0seUNBQXlDLEdBQzdDLDRDQUE0QyxDQUFDO0FBQy9DLE1BQU0sZ0NBQWdDLEdBQ3BDLDRDQUE0QyxDQUFDO0FBQy9DLE1BQU0saUNBQWlDLEdBQ3JDLDRDQUE0QyxDQUFDO0FBRS9DLE1BQU0seUNBQXlDLEdBQzdDLDRDQUE0QyxDQUFDO0FBQy9DLE1BQU0sZ0NBQWdDLEdBQ3BDLDRDQUE0QyxDQUFDO0FBQy9DLE1BQU0saUNBQWlDLEdBQ3JDLDRDQUE0QyxDQUFDO0FBRS9DLE1BQU0sNkJBQTZCLEdBQ2pD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