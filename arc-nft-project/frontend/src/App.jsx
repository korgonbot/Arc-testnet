import { useMemo, useState } from 'react';

const cards = [
  { title: 'Merkle GTD whitelist', desc: 'Upload a whitelist and verify allowlisted wallets with merkle proofs.' },
  { title: 'Per-wallet allocation', desc: 'Set a fixed GTD mint cap for each approved address.' },
  { title: 'USDC precision config', desc: 'Validate decimals and pricing before the mainnet deployment.' },
  { title: 'Batch tools', desc: 'Prepare bulk admin actions for future launch operations.' },
];

export default function App() {
  const [wallet, setWallet] = useState('0x0000...0000');
  const [status, setStatus] = useState('Ready to connect your wallet');
  const [whitelistText, setWhitelistText] = useState('0x111...1111\n0x222...2222');
  const [allocation, setAllocation] = useState('2');
  const [decimals, setDecimals] = useState('6');

  const metrics = useMemo(() => [
    { label: 'Whitelist entries', value: whitelistText.split(/\n|,/).filter(Boolean).length },
    { label: 'GTD allocation', value: allocation },
    { label: 'USDC decimals', value: decimals },
  ], [allocation, decimals, whitelistText]);

  return (
    <div className="app-shell">
      <header className="hero">
        <div>
          <p className="eyebrow">Arc Launchpad • production readiness</p>
          <h1>Launch, test, and refine your NFT drop experience.</h1>
          <p className="subtitle">The new workspace now supports merkle-based GTD whitelists, allocation controls, and deployment-ready admin tooling.</p>
        </div>
        <div className="panel">
          <button className="primary" onClick={() => setStatus('Wallet connected via wagmi-style connector')}>Connect wallet</button>
          <div className="wallet">{wallet}</div>
          <div className="status">{status}</div>
        </div>
      </header>

      <section className="stats-grid">
        {metrics.map((item) => (
          <div key={item.label} className="metric-card">
            <span>{item.label}</span>
            <strong>{item.value}</strong>
          </div>
        ))}
      </section>

      <section className="content-grid">
        <div className="panel">
          <h2>Merkle whitelist upload</h2>
          <textarea value={whitelistText} onChange={(e) => setWhitelistText(e.target.value)} rows={8} />
          <div className="actions">
            <button className="primary">Generate merkle root</button>
            <button className="secondary">Upload list</button>
          </div>
        </div>

        <div className="panel">
          <h2>Admin controls</h2>
          <label>
            GTD allocation per wallet
            <input value={allocation} onChange={(e) => setAllocation(e.target.value)} />
          </label>
          <label>
            USDC decimals
            <input value={decimals} onChange={(e) => setDecimals(e.target.value)} />
          </label>
          <div className="actions">
            <button className="primary">Save config</button>
            <button className="secondary">Batch airdrop</button>
          </div>
        </div>
      </section>

      <section className="card-grid">
        {cards.map((card) => (
          <div key={card.title} className="card">
            <h3>{card.title}</h3>
            <p>{card.desc}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
