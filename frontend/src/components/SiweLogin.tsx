"use client";

import { useEffect, useState } from "react";
import { ethers } from "ethers";
import { SiweMessage } from "siwe";
import { authControllerGetNonce, authControllerVerify } from "@/api/generated";
import { saveTokens } from "@/lib/auth";

export default function SiweLogin() {
  const [status, setStatus] = useState<string>("");
  const [isClient, setIsClient] = useState(false);
  const [address, setAddress] = useState<string | null>(null);

  useEffect(() => setIsClient(true), []);

  const handleLogin = async () => {
    try {
      if (!isClient) return;
      if (!window.ethereum) {
        setStatus("⚠️ Εγκατέστησε MetaMask ή άνοιξέ το για τη σελίδα.");
        return;
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      const [addr] = await provider.send("eth_requestAccounts", []);
      setAddress(addr);

      // 1) πάρε nonce από backend
      const { data: nonceResp } = await authControllerGetNonce();
      const nonce = (nonceResp as any)?.nonce;
      if (!nonce) throw new Error("Nonce not received");

      // 2) φτιάξε SIWE μήνυμα
      const network = await provider.getNetwork();
      const message = new SiweMessage({
        domain: window.location.host,
        address: addr,
        statement: "Sign in with Ethereum to Web3 Auth Dashboard",
        uri: window.location.origin,
        version: "1",
        chainId: Number(network.chainId ?? 1),
        nonce,
      }).prepareMessage();

      // 3) υπέγραψε
      const signer = await provider.getSigner();
      const signature = await signer.signMessage(message);

      // 4) verify στο backend
      const { data: tokens } = await authControllerVerify({
        data: { message, signature },
      });

      const { accessToken, refreshToken } = tokens as any;
      if (!accessToken || !refreshToken) {
        throw new Error("Tokens not returned");
      }

      // 5) αποθήκευσε tokens
      saveTokens(accessToken, refreshToken);
      setStatus("✅ Συνδέθηκες επιτυχώς!");
    } catch (e: any) {
      console.error(e);
      setStatus(`❌ Σφάλμα: ${e.message ?? "unknown error"}`);
    }
  };

  return (
    <div className="flex flex-col items-center gap-3 p-6">
      <button
        onClick={handleLogin}
        className="px-6 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700"
      >
        {address ? "Sign Message" : "Connect Wallet"}
      </button>
      {address && <p className="text-sm opacity-80">🔗 {address}</p>}
      {status && <p>{status}</p>}
    </div>
  );
}
