import { Provider } from "@ethersproject/providers";
import { Signer } from "ethers";
import type { IUniswapV2Pair, IUniswapV2PairInterface } from "../IUniswapV2Pair";
export declare class IUniswapV2Pair__factory {
    static readonly abi: ({
        anonymous: boolean;
        inputs: {
            indexed: boolean;
            internalType: string;
            name: string;
            type: string;
        }[];
        name: string;
        type: string;
        constant?: undefined;
        outputs?: undefined;
        payable?: undefined;
        stateMutability?: undefined;
    } | {
        constant: boolean;
        inputs: {
            internalType: string;
            name: string;
            type: string;
        }[];
        name: string;
        outputs: {
            internalType: string;
            name: string;
            type: string;
        }[];
        payable: boolean;
        stateMutability: string;
        type: string;
        anonymous?: undefined;
    })[];
    static createInterface(): IUniswapV2PairInterface;
    static connect(address: string, signerOrProvider: Signer | Provider): IUniswapV2Pair;
}
