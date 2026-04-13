import type { Address } from "viem";

export const WEPAY_REGISTRAR_ADDRESS = process.env.NEXT_PUBLIC_WEPAY_REGISTRAR_ADDRESS as Address | undefined;

export const WEPAY_REGISTRAR_ABI = [
  {
    name: "claimSubdomain",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "handle",            type: "string"  },
      { name: "owsVaultAddress",   type: "address" },
      { name: "solanaCardAddress", type: "bytes"   },
    ],
    outputs: [],
  },
  {
    name: "isAvailable",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "handle", type: "string" }],
    outputs: [{ name: "", type: "bool" }],
  },
  {
    name: "updateSolanaAddress",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "handle",           type: "string" },
      { name: "newSolanaAddress", type: "bytes"  },
    ],
    outputs: [],
  },
  {
    name: "updateOWSAddress",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "handle", type: "string" },
      { name: "newOWSAddress", type: "address" },
    ],
    outputs: [],
  },
  {
    name: "SubdomainClaimed",
    type: "event",
    inputs: [
      { name: "handle",          type: "string",  indexed: true  },
      { name: "labelHash",       type: "bytes32", indexed: true  },
      { name: "subnodeHash",     type: "bytes32", indexed: true  },
      { name: "claimer",         type: "address", indexed: false },
      { name: "owsVaultAddress", type: "address", indexed: false },
      { name: "expiry",          type: "uint64",  indexed: false },
    ],
  },
] as const;

// ENS NameWrapper on Ethereum mainnet
export const NAME_WRAPPER_ADDRESS: Address = "0xD4416b13d2b3a9aBae7AcD5D6C2BbDBE25686401";

// namehash("wepay.eth") — verified with: cast namehash wepay.eth
export const WEPAY_NODE = "0x783b76a8de513b3731a5998d7770987e5ff5aaa322aee1871ad6b16b0a561861" as `0x${string}`;

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3001";

export const MOONPAY_ENV = (process.env.NEXT_PUBLIC_MOONPAY_ENV ?? "sandbox") as "sandbox" | "production";

export const WEPAY_TREASURY_ADDRESS = process.env.NEXT_PUBLIC_WEPAY_TREASURY_ADDRESS as Address | undefined;
