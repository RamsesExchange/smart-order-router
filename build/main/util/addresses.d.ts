import { Token } from '@uniswap/sdk-core';
import { ChainId } from './chains';
export declare const RAMSES_POOL_INIT_CODE_HASH = "0x1565b129f2d1790f12d45301b9b084335626f0c92410bc43130763b69971135d";
export declare const BSC_TICK_LENS_ADDRESS = "0xD9270014D396281579760619CCf4c3af0501A47C";
export declare const BSC_NONFUNGIBLE_POSITION_MANAGER_ADDRESS = "0x7b8A01B39D58278b5DE7e48c8449c9f4F5170613";
export declare const BSC_SWAP_ROUTER_02_ADDRESS = "0xB971eF87ede563556b2ED4b1C0b0019111Dd85d2";
export declare const BSC_V3_MIGRATOR_ADDRESS = "0x32681814957e0C13117ddc0c2aba232b5c9e760f";
export declare const V3_CORE_FACTORY_ADDRESSES: AddressMap;
export declare const QUOTER_V2_ADDRESSES: AddressMap;
export declare const MIXED_ROUTE_QUOTER_V1_ADDRESSES: AddressMap;
export declare const UNISWAP_MULTICALL_ADDRESSES: AddressMap;
export declare const SWAP_ROUTER_02_ADDRESSES: (chainId: number) => "0xAA23611badAFB62D37E7295A682D21960ac85A90" | "0xB971eF87ede563556b2ED4b1C0b0019111Dd85d2" | "0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45";
export declare const OVM_GASPRICE_ADDRESS = "0x420000000000000000000000000000000000000F";
export declare const ARB_GASINFO_ADDRESS = "0x000000000000000000000000000000000000006C";
export declare const TICK_LENS_ADDRESS = "0xAA22A15c56e0Dd62eaA30B8C1f9F3eE6D137CeeB";
export declare const NONFUNGIBLE_POSITION_MANAGER_ADDRESS = "0xAA277CB7914b7e5514946Da92cb9De332Ce610EF";
export declare const V3_MIGRATOR_ADDRESS = "0xAA27816EFCd7Ad09f8d80E9027a222cCc017Fbc7";
export declare const MULTICALL2_ADDRESS = "0x1F98415757620B543A52E61c46B32eB19261F984";
export declare type AddressMap = {
    [chainId: number]: string;
};
export declare function constructSameAddressMap<T extends string>(address: T, additionalNetworks?: ChainId[]): {
    [chainId: number]: T;
};
export declare const WETH9: {
    [chainId in Exclude<ChainId, ChainId.POLYGON | ChainId.POLYGON_MUMBAI | ChainId.CELO | ChainId.CELO_ALFAJORES | ChainId.GNOSIS | ChainId.MOONBEAM | ChainId.BSC>]: Token;
};
