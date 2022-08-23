import { useEnsName } from 'wagmi';
import { isAvailableOnENS } from 'Components/ActionsBuilder/SupportedActions/UpdateENSContent/utils';
import { MAINNET_ID } from 'utils';

export default function useENSNameFromAddress(
  ensAddress?: string,
  chainId?: number
) {
  const supportedChainId = isAvailableOnENS(chainId) ? chainId : MAINNET_ID;
  const {
    data: ensName,
    isLoading,
    isError,
  } = useEnsName({
    address: ensAddress,
    chainId: supportedChainId,
  });

  return {
    ensName,
    isLoading,
    isError,
  };
}
