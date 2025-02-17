import contenthash from 'content-hash';
import { MAINNET_ID, LOCALHOST_ID } from 'utils';
import { utils } from 'ethers';

const DEFAULT_NAMEHASH =
  '0x0000000000000000000000000000000000000000000000000000000000000000';

export const convertToNameHash = (name: string) => {
  if (!name) {
    return DEFAULT_NAMEHASH;
  }
  return utils.namehash(name);
};

export const convertToContentHash = (ipfsHash: string) => {
  if (!ipfsHash) {
    return '';
  }
  return contenthash.fromIpfs(ipfsHash);
};

export const convertToIpfsHash = (contentHash: string) => {
  if (!contentHash) return null;
  return contenthash.decode(contentHash);
};

export const getIpfsUrl = (ipfsHash: string) => {
  const ipfsRoot = 'ipfs://';
  return ipfsHash ? `${ipfsRoot}${ipfsHash}` : null;
};

export const isSupportedChainId = (chainId: number) => {
  if (!chainId || chainId === LOCALHOST_ID) {
    return MAINNET_ID;
  } else {
    return chainId;
  }
};
