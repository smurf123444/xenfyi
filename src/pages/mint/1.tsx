import {
  useFeeData,
  useNetwork,
  useAccount,
  useContractRead,
  useContractWrite,
  useContractReads,
  useWaitForTransaction,
  usePrepareContractWrite,
} from "wagmi";
import Container from "~/components/containers/Container";
import { MaxValueField } from "~/components/FormFields";
import { InformationCircleIcon } from "@heroicons/react/outline";
import { DateStatCard, NumberStatCard } from "~/components/StatCards";
import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useState, useContext } from "react";
import { useForm } from "react-hook-form";
import { xenContract } from "~/lib/xen-contract";
import { ErrorMessage } from "@hookform/error-message";
import { yupResolver } from "@hookform/resolvers/yup";
import { UTC_TIME } from "~/lib/helpers";
import toast from "react-hot-toast";
import { clsx } from "clsx";
import * as yup from "yup";
import GasEstimate from "~/components/GasEstimate";
import CardContainer from "~/components/containers/CardContainer";
import XENContext from "~/contexts/XENContext";
import { merkle } from "~/lib/merkle";
const Mint = () => {
  const { address } = useAccount();
  const { chain } = useNetwork();
  const router = useRouter();
  const { userMint, feeData } = useContext(XENContext);
  const [disabled, setDisabled] = useState(true);

  const [processing, setProcessing] = useState(false);


  /*** CONTRACT READ SETUP  ***/
  interface MyObj {
    index: string;
    amount: string;
    proof: string[];
}
//only works with valid account in Claims. (DUHH)


  const { data } = useContractRead({
    ...xenContract(chain),
    functionName: "getUserMint",
    overrides: { from: address },
    watch: true,
  });

/*   const { data: contractReads } = useContractReads({
    contracts: [
      {
        ...xenContract(chain),
        functionName: "getCurrentMaxTerm",
      },
      {
        ...xenContract(chain),
        functionName: "globalRank",
      },
    ],
    watch: true,
  }); */

  /*** FORM SETUP ***/

 const schema = yup
    .object()
    .shape({
    })



  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
    setValue,
  } = useForm({
    resolver: yupResolver(schema),
  });
  const watchAllFields = watch(); 
  const { handleSubmit: cHandleSubmit } = useForm();
  /*** CONTRACT WRITE SETUP ***/
  var parsed: MyObj = {
    index: "0",
    amount: "0",
    proof: []
  }
if(merkle.claims[address as keyof typeof address] != undefined)
{  
  let result = JSON.stringify(merkle.claims[address as keyof typeof address]);
  parsed = JSON.parse(result) as MyObj;
 }

 const { config: contractConfig, error } = usePrepareContractWrite({
   ...xenContract(chain),
   functionName: "claim",
   args: [
     parsed.index,
     address,
     parsed.amount,
     parsed.proof
   ],
 });
/*   const { config: contractConfig, error } = usePrepareContractWrite({
    ...xenContract(chain),
    functionName: "claimMintReward",
  }); */
  const { write } = useContractWrite({
    ...contractConfig,
    onSuccess(data) {
    //  setProcessing(true);
   //   setDisabled(true);
    },
  });
  const {} = useWaitForTransaction({
    onSuccess(data) {
      toast("Claim successful");
      router.push("/mint/2");
    },
  });
  const onSubmit = () => {
    write?.();
  };
/* 
  const { handleSubmit: cHandleSubmitReward } = useForm();

  const { config: configClaim } = usePrepareContractWrite({
 ...xenContract(chain),
    functionName: "claimMintReward"
  });
  const { data: claimData, write: writeClaim } = useContractWrite({
    ...configClaim,
    onSuccess(data) {
      setProcessing(true);
      setDisabled(true);
    },
  });
  const handleClaimSubmitReward = () => {
    writeClaim?.();
  };
  const {} = useWaitForTransaction({
    hash: claimData?.hash,
    onSuccess(data) {
      toast("Claim mint successful");

      router.push("/stake/1");
    },
  }); */
  /*** USE EFFECT ****/
//console.log(data);
  useEffect(() => {
/*     if (watchAllFields.startMintDays) {
      setMaturity(UTC_TIME + watchAllFields.startMintDays * 86400);
    } */
    if (!processing && address && data?.[1] == false) {
      setDisabled(false);
    }

    //setMaxFreeMint(Number(contractReads?.[0] ?? 8640000) / 86400);
  }, [
    address,
    contractConfig?.request?.gasLimit,
    data,
    feeData?.gasPrice,
    processing,
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
          <form onSubmit={cHandleSubmit(onSubmit)}>

            <div className="flex flex-col space-y-4">
              <h2 className="card-title text-neutral">Claim Free Tokens</h2>

              <div className="form-control w-full">
                <button
                  type="submit"
                  className={clsx("btn glass text-neutral", {
                    loading: processing,
                  })}
                  //onClick={() => write?.()}
                  disabled={disabled}
                >
                  Start Mint
                </button>
              </div>
              <GasEstimate
                  feeData={feeData}
                  gasLimit={contractConfig?.request?.gasLimit}
                />
            </div>
          </form>
        </CardContainer>

{/*         <CardContainer>
          <form >

            <div className="flex flex-col space-y-4">
              <h2 className="card-title text-neutral">Claim Free Tokens</h2>

              <div className="form-control w-full">
                <button
                  type="submit"
                  className={clsx("btn glass text-neutral", {
                    loading: processing,
                  })}
                  //onClick={() => write?.()}
                  disabled={disabled}
                >
                  Claim Mint
                </button>
              </div>
              <GasEstimate
                  feeData={feeData}
                  gasLimit={contractConfig?.request?.gasLimit}
                />
            </div>
          </form>
        </CardContainer> */}
      </div>
    </Container>
  );
};

export default Mint;
