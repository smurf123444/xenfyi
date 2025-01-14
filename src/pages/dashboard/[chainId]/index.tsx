import type { NextPage } from "next";
import Container from "~/components/containers/Container";
import { useContext, useEffect } from "react";
import { useRouter } from "next/router";
import {
  NumberStatCard,
  ChainStatCard,
  DateStatCard,
  DataCard,
} from "~/components/StatCards";
import CardContainer from "~/components/containers/CardContainer";
import { xenContract } from "~/lib/xen-contract";
import { chainIcons } from "~/components/Constants";
import Link from "next/link";
import { chainList } from "~/lib/client";
import XENContext from "~/contexts/XENContext";

const Dashboard: NextPage = () => {
  const router = useRouter();
  const { chainId } = router.query as unknown as { chainId: number };
  const chainFromId = chainList.find((c) => c && c.id == chainId);

  const {
    setChainOverride,
    globalRank,
    activeMinters,
    activeStakes,
    totalXenStaked,
    totalSupply,
    currentMaxTerm,
    genesisTs,
    currentAPY,
    token,
  } = useContext(XENContext);

  const generalStats = [

    {
      title: "Active Minters",
      value: activeMinters,
    },
    {
      title: "Active Stakes",
      value: activeStakes,
    },

  ];

  const stakeItems = [
    {
      title: "Total",
      value: (totalSupply + totalXenStaked) / 1e18,
    },
    {
      title: "Liquid",
      value: totalSupply / 1e18,
    },
    {
      title: "Stake",
      value: totalXenStaked / 1e18,
    },
  ];

  const rewardsItems = [

    {
      title: "APY",
      value: currentAPY,
      decimals: 0,
      suffix: "%",
      tooltip:
        "Annual Percentage Yield (APY) determines XEN Staking Reward calculation. It is non-compounding and is pro-rated by days. APY starts at 20% on Genesis and decreases by 1p.p. every 90 days until it reaches 2%",
    },
  ];

  useEffect(() => {
    if (chainFromId) {
      setChainOverride(chainFromId);
    }
  }, [chainFromId, setChainOverride]);

  return (
    <div>
      <Container className="max-w-2xl">
        <div className="flex flex-col space-y-8">
          <div className="dropdown dropdown-hover">
            <label tabIndex={0} className="btn m-1 glass text-neutral">
              Select Chain
            </label>
            <ul
              tabIndex={0}
              className="dropdown-content menu p-2 shadow rounded-box glass w-64 flex space-y-2"
            >
              {chainList
                .filter((chain) => !chain.testnet)
                .map((c) => (
                  <li key={c.id}>
                    <Link href={`/dashboard/${c.id}`}>
                      <a className="text-neutral justify-between glass">
                        {c.name}
                        {chainIcons[c.id]}
                      </a>
                    </Link>
                  </li>
                ))}
            </ul>
          </div>

          <CardContainer>
            <h2 className="card-title">General Stats</h2>
            <div className="stats stats-vertical bg-transparent text-neutral">
              <ChainStatCard
                value={chainFromId?.name ?? "Ethereum"}
                id={chainFromId?.id ?? 1}
              />
              <DateStatCard
                title="Days Since Launch"
                dateTs={genesisTs}
                isPast={true}
              />
              {token && (
                <DataCard
                  title={"Contract"}
                  value={token?.symbol ?? "XEN"}
                  description={xenContract(chainFromId).addressOrName}
                />
              )}

              {generalStats.map((item, index) => (
                <NumberStatCard
                  key={index}
                  title={item.title}
                  value={item.value}
                  decimals={0}
                />
              ))}
            </div>
          </CardContainer>

          <CardContainer>
            <h2 className="card-title">Supply</h2>
            <div className="stats stats-vertical bg-transparent text-neutral">
              {stakeItems.map((item, index) => (
                <NumberStatCard
                  key={index}
                  title={item.title}
                  value={item.value}
                />
              ))}
            </div>
          </CardContainer>

          <CardContainer>
            <h2 className="card-title">Rewards</h2>
            <div className="stats stats-vertical bg-transparent text-neutral">
              {rewardsItems.map((item, index) => (
                <NumberStatCard
                  key={index}
                  title={item.title}
                  value={item.value}
                  decimals={item.decimals}
                  suffix={item.suffix}
                  tooltip={item.tooltip}
                />
              ))}
            </div>
          </CardContainer>
        </div>
      </Container>
    </div>
  );
};

export default Dashboard;
