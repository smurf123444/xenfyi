import {
  useNetwork,
  useAccount,
  useContractWrite,
  useContractRead,
  useWaitForTransaction,
  usePrepareContractWrite,
} from "wagmi";
import Link from "next/link";
import Container from "~/components/containers/Container";
import GasEstimate from "~/components/GasEstimate";
import { MaxValueField, WalletAddressField } from "~/components/FormFields";
import { useState, useEffect, useContext } from "react";
import { useRouter } from "next/router";
import { useForm } from "react-hook-form";
import { xenContract } from "~/lib/xen-contract";
import { ErrorMessage } from "@hookform/error-message";
import { yupResolver } from "@hookform/resolvers/yup";
import { CountDataCard } from "~/components/StatCards";
import {
  mintPenalty,
  UTC_TIME,
  WALLET_ADDRESS_REGEX,
} from "~/lib/helpers";
import toast from "react-hot-toast";
import { clsx } from "clsx";
import * as yup from "yup";
import CardContainer from "~/components/containers/CardContainer";
import XENContext from "~/contexts/XENContext";
import XENCryptoABI from "~/abi/XENCryptoABI";
import { merkle } from "~/lib/merkle";
const Web3 = require('web3');
const Mint = () => {
  const { address } = useAccount();
  const { chain } = useNetwork();
  const router = useRouter();

  const [disabled, setDisabled] = useState(true);
  const [activeStakeDisabled, setActiveStakeDisabled] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [penaltyPercent, setPenaltyPercent] = useState(0);
  const [penaltyXEN, setPenaltyXEN] = useState(0);
  const [reward, setReward] = useState(0);
  const { userMint, userStake, feeData } = useContext(XENContext);

  /*** FORM SETUP ***/
  interface MyObj {
    index: string;
    amount: number;
    proof: string[];
}

//only works with valid account in Claims. (DUHH)
const estimatedClaimAmount = () => {
  let result = JSON.stringify(merkle.claims != undefined ? merkle.claims[address as keyof typeof address] : 'titsErrors');
  if (result) {
      const parsed = JSON.parse(result) as MyObj;
    return parsed.amount.toString();
  } else {
    const XEN = 0
    return XEN.toString();
  }
}

const { data } = useContractRead({
  ...xenContract(chain),
  functionName: "getUserMint",
  overrides: { from: address },
  watch: true,
});

  // Claim
  const { handleSubmit: cHandleSubmit } = useForm();

  const { config: configClaim } = usePrepareContractWrite({
    addressOrName: xenContract(chain).addressOrName,
    contractInterface: XENCryptoABI,
    functionName: "claimMintReward",
    onSuccess(data) {
      setProcessing(false);
      setDisabled(false);
      toast("Drop Ready");
      console.log("Drop Ready")
      setReward(Number(Web3.utils.fromWei(estimatedClaimAmount().toString(), 'ether'))) ;
    },
    onError(data) {
      setProcessing(true);
      setDisabled(true);
      toast.error("Mint Not Available. (either Havent Claimed (go back to Start Mint),\n or you already Minted (Hooray!))");
      console.log("Drop Not Available")
      setReward(Number(Web3.utils.fromWei("0", 'ether'))) ;
    },
  });
  const { data: claimData, write: writeClaim } = useContractWrite({
    ...configClaim,
    onSuccess(data) {
      setProcessing(true);
      setDisabled(true);
    },
  });
  const handleClaimSubmit = () => {
    writeClaim?.();
  };
  const {} = useWaitForTransaction({
    hash: claimData?.hash,
    onSuccess(data) {
      toast("Claim mint successful");

      router.push("/stake/1");
    },
  });

  // Claim + Share

  const schemaClaimShare = yup
    .object()
    .shape({
      claimShareAddress: yup
        .string()
        .required("Crypto address required")
        .matches(WALLET_ADDRESS_REGEX, {
          message: "Invalid address",
          excludeEmptyString: true,
        }),
      claimSharePercentage: yup
        .number()
        .required("Percentage required")
        .positive("Percentage must be greater than 0")
        .max(100, "Maximum claim + share percentage: 100")
        .typeError("Percentage required"),
    })
    .required();

  const {
    register: cShareRegister,
    handleSubmit: cShareHandleSubmit,
    watch: cShareWatch,
    formState: { errors: cShareErrors, isValid: cShareIsValid },
    setValue: cShareSetValue,
  } = useForm({
    mode: "onChange",
    resolver: yupResolver(schemaClaimShare),
  });
  const cShareWatchAllFields = cShareWatch();

  const { config: configClaimShare } = usePrepareContractWrite({
    addressOrName: xenContract(chain).addressOrName,
    contractInterface: XENCryptoABI,
    functionName: "claimMintRewardAndShare",
    args: [
      cShareWatchAllFields.claimShareAddress,
      cShareWatchAllFields.claimSharePercentage,
    ],
  });

  const { data: claimShareData, write: writeClaimShare } = useContractWrite({
    ...configClaimShare,
    onSuccess(data) {
      setProcessing(true);
      setDisabled(true);
    },
  });
  const handleClaimShareSubmit = () => {
    writeClaimShare?.();
  };
  const {} = useWaitForTransaction({
    hash: claimShareData?.hash,
    onSuccess(data) {
      toast("Claim mint and share successful");
      router.push("/stake/1");
    },
  });

  // Claim + Stake

  const schemaClaimStake = yup
    .object()
    .shape({
      claimStakePercentage: yup
        .number()
        .required("Percentage required")
        .positive("Percentage must be greater than 0")
        .max(100, "Maximum claim + stake percentage: 100")
        .typeError("Percentage required"),
      claimStakeDays: yup
        .number()
        .required("Days required")
        .max(1000, "Maximum stake days: 1000")
        .positive("Days must be greater than 0")
        .typeError("Days required"),
    })
    .required();

  const {
    register: cStakeRegister,
    handleSubmit: cStakeHandleSubmit,
    watch: cStakeWatch,
    formState: { errors: cStakeErrors, isValid: cStakeIsValid },
    setValue: cStakeSetValue,
  } = useForm({
    mode: "onChange",
    resolver: yupResolver(schemaClaimStake),
  });
  const cStakeWatchAllFields = cStakeWatch();

  const { config: configClaimStake } = usePrepareContractWrite({
    addressOrName: xenContract(chain).addressOrName,
    contractInterface: XENCryptoABI,
    functionName: "claimMintRewardAndStake",
    args: [
      cStakeWatchAllFields.claimStakePercentage,
      cStakeWatchAllFields.claimStakeDays,
    ],
  });

  const { data: claimStakeData, write: writeClaimStake } = useContractWrite({
    ...configClaimStake,
    onSuccess(data) {
      setProcessing(true);
      setDisabled(true);
    },
  });

  const handleClaimStakeSubmit = () => {
    writeClaimStake?.();
  };
  const {} = useWaitForTransaction({
    hash: claimStakeData?.hash,
    onSuccess(data) {
      toast("Claim mint and stake successful");
      router.push("/stake/2");
    },
  });
let i = 0;

  /*** USE EFFECT ****/
  useEffect(() => {
    if (
      address 
      && data
    ) {
      if (!processing && data?.[1]==true) {
        setDisabled(false);
      }
    }



    if (address && userStake && userStake.term.toNumber() == 0) {
      setActiveStakeDisabled(false);
    }
  }, [
    activeStakeDisabled,
    address,
    processing,
    userMint,
    userStake,
    cShareIsValid,
    cStakeIsValid,
    configClaimShare,
    configClaimStake, 
  ]);

  return (
    <Container className="max-w-2xl">
      <div className="flew flex-row space-y-8 ">
        <ul className="steps w-full">
          <Link href="/mint/1">
            <a className="step step-neutral">Start Mint</a>
          </Link>

          <Link href="/mint/2">
            <a className="step step-neutral">Mint</a>
          </Link>
        </ul>

        <CardContainer>
          <div className="flex flex-col w-full border-opacity-50">
            <form onSubmit={cHandleSubmit(handleClaimSubmit)}>
              <div className="flex flex-col space-y-4">
                <h2 className="card-title text-neutral">Claim Mint</h2>

                <div className="flex stats glass w-full text-neutral">
                  <CountDataCard
                    title="Reward"
                    value={reward}
                    description="XEN"
                  />
                </div>

                <div className="form-control w-full">
                  <button
                    type="submit"
                    className={clsx("btn glass text-neutral", {
                      loading: processing,
                    })}
                    disabled={disabled}
                  >
                    Claim Mint
                  </button>
                </div>

                <GasEstimate
                  feeData={feeData}
                  gasLimit={configClaim?.request?.gasLimit}
                />
              </div>
            </form>
          </div>
        </CardContainer>

     
        <div className="divider">OR</div>
     
        <CardContainer>
          <div className="flex flex-col w-full border-opacity-50">
            <form onSubmit={cShareHandleSubmit(handleClaimShareSubmit)}>
              <div className="flex flex-col space-y-4">
                <h2 className="card-title text-neutral">Claim Mint + Share</h2>

                <div className="flex stats glass w-full text-neutral">
                  <CountDataCard
                    title="Reward"
                    value={reward}
                    description="XEN"
                  />
                  <CountDataCard
                    title="Penalty"
                    value={penaltyPercent}
                    suffix="%"
                    descriptionNumber={penaltyXEN}
                    descriptionNumberSuffix=" XEN"
                  />
                </div>

                <MaxValueField
                  title="PERCENTAGE"
                  description="Stake percentage"
                  decimals={0}
                  value={100}
                  disabled={disabled}
                  errorMessage={
                    <ErrorMessage
                      errors={cShareErrors}
                      name="claimSharePercentage"
                    />
                  }
                  register={cShareRegister("claimSharePercentage")}
                  setValue={cShareSetValue}
                />

                <WalletAddressField
                  disabled={disabled}
                  errorMessage={
                    <ErrorMessage
                      errors={cShareErrors}
                      name="claimShareAddress"
                    />
                  }
                  register={cShareRegister("claimShareAddress")}
                />

                <div className="form-control w-full">
                  <button
                    type="submit"
                    className={clsx("btn glass text-neutral", {
                      loading: processing,
                    })}
                    disabled={disabled}
                  >
                    Claim Mint + Share
                  </button>
                </div>

                <GasEstimate
                  feeData={feeData}
                  gasLimit={configClaimShare?.request?.gasLimit}
                />
              </div>
            </form>
          </div>
        </CardContainer>

   
        <div className="divider">OR</div>
     
        <CardContainer>
          <div className="flex flex-col w-full border-opacity-50">
            <form onSubmit={cStakeHandleSubmit(handleClaimStakeSubmit)}>
              <div className="flex flex-col space-y-4">
                <h2 className="card-title text-neutral">Claim Mint + Stake</h2>

                <div className="flex stats glass w-full text-neutral">
                  <CountDataCard
                    title="Reward"
                    value={reward}
                    description="XEN"
                  />
                  <CountDataCard
                    title="Penalty"
                    value={penaltyPercent}
                    suffix="%"
                    descriptionNumber={penaltyXEN}
                    descriptionNumberSuffix=" XEN"
                  />
                </div>

                <MaxValueField
                  title="PERCENTAGE"
                  description="Stake percentage"
                  decimals={0}
                  value={100}
                  disabled={disabled || activeStakeDisabled}
                  errorMessage={
                    <ErrorMessage
                      errors={cStakeErrors}
                      name="claimStakePercentage"
                    />
                  }
                  register={cStakeRegister("claimStakePercentage")}
                  setValue={cStakeSetValue}
                />

                <MaxValueField
                  title="DAYS"
                  description="Stake days"
                  decimals={0}
                  value={1000}
                  disabled={disabled || activeStakeDisabled}
                  errorMessage={
                    <ErrorMessage errors={cStakeErrors} name="claimStakeDays" />
                  }
                  register={cStakeRegister("claimStakeDays")}
                  setValue={cStakeSetValue}
                />

                <div className="form-control w-full">
                  <button
                    type="submit"
                    className={clsx("btn glass text-neutral", {
                      loading: processing,
                    })}
                    disabled={disabled || activeStakeDisabled}
                  >
                    Claim Mint + Stake
                  </button>
                </div>

               <GasEstimate
                  feeData={feeData}
                  gasLimit={configClaimStake?.request?.gasLimit}
                /> 
              </div>
            </form>
          </div>
        </CardContainer>
             
      </div> 
                  
    </Container>
  );
};

export default Mint;