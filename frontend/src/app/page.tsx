import SiweLogin from "@/components/SiweLogin";

export default function HomePage() {
  return (
    <main
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "100vh",
        textAlign: "center",
      }}
    >
      <h1>Web3 Auth Dashboard</h1>
      <p>Sign in with your Ethereum wallet</p>
      <SiweLogin />
    </main>
  );
}
