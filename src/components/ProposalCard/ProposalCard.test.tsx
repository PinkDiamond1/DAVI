import { ProposalCard, ProposalCardProps } from 'components/ProposalCard';
import { render } from '../../utils/tests';
import {
  ensAvatarMock,
  optionsMock,
  optionsWithSeveralActionsMock,
  proposalMock,
  proposalStatusPropsMock,
} from 'utils/fixtures';
import { BigNumber } from 'ethers';
import { mockChain } from 'components/Web3Modals/fixtures';

const mockBigNumber = BigNumber.from(100000000);

jest.mock('hooks/Guilds/ens/useENSAvatar', () => ({
  __esModule: true,
  default: () => ({
    avatarUri: 'test',
    imageUrl: 'test',
    ensName: 'test.eth',
  }),
}));

jest.mock('hooks/Guilds/erc20/useERC20Info', () => ({
  useERC20Info: () => ({
    name: 'Test ERC20',
    symbol: 'TEST',
    decimals: 18,
    totalSupply: mockBigNumber,
  }),
}));

jest.mock('wagmi', () => ({
  chain: {},
  useNetwork: () => ({ chain: mockChain, chains: [mockChain] }),
}));

const validProps: ProposalCardProps = {
  proposal: proposalMock,
  ensAvatar: ensAvatarMock,
  href: 'testUrl',
  statusProps: proposalStatusPropsMock,
  options: [optionsMock],
};

const invalidProps: ProposalCardProps = {
  proposal: null,
  ensAvatar: null,
  href: null,
  statusProps: {
    timeDetail: null,
    status: null,
    endTime: null,
  },
  options: null,
};
describe('ProposalCard', () => {
  it('ProposalCard Renders properly with data', () => {
    const { container } = render(<ProposalCard {...validProps} />);
    expect(container).toMatchSnapshot();
  });

  it('ProposalCard Renders properly with more than one option ', () => {
    const propsWithMoreThanOneOption = {
      ...validProps,
      options: [optionsMock, optionsMock],
    };

    const { container } = render(
      <ProposalCard {...propsWithMoreThanOneOption} />
    );
    expect(container).toMatchSnapshot();
  });

  it('ProposalCard Renders properly with more than one option containing more than one action', () => {
    let optionWithSeveralActions = {
      ...validProps,
      options: [optionsWithSeveralActionsMock],
    };

    const { container } = render(
      <ProposalCard {...optionWithSeveralActions} />
    );
    expect(container).toMatchSnapshot();
  });

  it('ProposalCard loading', () => {
    const { container } = render(<ProposalCard {...invalidProps} />);
    expect(container).toMatchSnapshot();
  });
});
