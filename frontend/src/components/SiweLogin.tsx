"use client";
import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { SiweMessage } from "siwe";
import { authControllerGetNonce, authControllerVerify } from "@/api/generated";

export default function SiweLogin() {
  const [status, setStatus] = useState("");
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    // ensures we are on the client side
    setIsClient(true);
  }, []);

  const handleLogin = async () => {
    if (!isClient) return;
    if (typeof window.ethereum === "undefined") {
      setStatus("⚠️ Please install MetaMask or enable a wallet extension.");
      return;
    }

    const provider = new ethers.BrowserProvider(window.ethereum);
    const [address] = await provider.send("eth_requestAccounts", []);

    // 1️⃣ Get nonce from backend
    const { data } = await authControllerGetNonce();
    const nonce = data?.nonce;

    // 2️⃣ Prepare SIWE message
    const message = new SiweMessage({
      domain: window.location.host,
      address,
      statement: "Sign in with Ethereum",
      uri: window.location.origin,
      version: "1",
      chainId: 1,
      nonce,
    }).prepareMessage();

    // 3️⃣ Sign
    const signer = await provider.getSigner();
    const signature = await signer.signMessage(message);

    // 4️⃣ Verify with backend
    const { data: tokens } = await authControllerVerify({
      data: { message, signature },
    });

    console.log("✅ Tokens:", tokens);
    setStatus("✅ Signed in successfully!");
  };

  return (
    <div className="flex flex-col items-center gap-3 p-6">
      <button
        onClick={handleLogin}
        className="px-6 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700"
      >
        Connect Wallet
      </button>
      {status && <p>{status}</p>}
    </div>
  );
}
