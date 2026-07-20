import { useMemo, useState } from 'react';

const cards = [
  { title: 'Merkle GTD whitelist', desc: 'Upload a whitelist and verify allowlisted wallets with merkle proofs.' },
  { title: 'Per-wallet allocation', desc: 'Set a fixed GTD mint cap for each approved address.' },
  { title: 'Launch-day admin controls', desc: 'Enable mint, pause the contract, reveal metadata, and freeze it when ready.' },
  { title: 'Marketplace operations', desc: 'Approve, list, cancel, and buy NFTs directly from the launch dashboard.' },
];

export default function App() {
  const [wallet, setWallet] = useState('0x0000...0000');
  const [status, setStatus] = useState('Ready to connect your wallet');
  const [whitelistText, setWhitelistText] = useState('0x111...1111\n0x222...2222');
  const [allocation, setAllocation] = useState('2');
  const [decimals, setDecimals] = useState('6');
  const [mintMode, setMintMode] = useState('public');
  const [paused, setPaused] = useState(false);
  const [metadataStage, setMetadataStage] = useState('Hidden');

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
          <h2>Launch-day admin controls</h2>
          <label>
            GTD allocation per wallet
            <input value={allocation} onChange={(e) => setAllocation(e.target.value)} />
          </label>
          <label>
            USDC decimals
            <input value={decimals} onChange={(e) => setDecimals(e.target.value)} />
          </label>
          <label>
            Mint mode
            <select value={mintMode} onChange={(e) => setMintMode(e.target.value)}>
              <option value="public">Public</option>
              <option value="gtd">GTD / whitelist</option>
              <option value="both">Both</option>
            </select>
          </label>
          <div className="actions">
            <button className="primary">Enable mint</button>
            <button className="secondary" onClick={() => setPaused((value) => !value)}>{paused ? 'Unpause' : 'Pause'}</button>
          </div>
          <div className="actions" style={{ marginTop: 10 }}>
            <button className="secondary" onClick={() => setMetadataStage('Revealed')}>Reveal metadata</button>
            <button className="secondary" onClick={() => setMetadataStage('Frozen')}>Freeze metadata</button>
          </div>
          <div className="status">Metadata state: {metadataStage}</div>
        </div>
      </section>

      <section className="content-grid">
        <div className="panel">
          <h2>Marketplace actions</h2>
          <p className="subtitle">Approve the marketplace, list an NFT, or cancel a listing from the launch dashboard.</p>
          <div className="actions">
            <button className="primary">Approve marketplace</button>
            <button className="secondary">List NFT</button>
            <button className="secondary">Cancel listing</button>
          </div>
        </div>

        <div className="panel">
          <h2>Launch metrics</h2>
          <p className="subtitle">Use this section to monitor sold supply, remaining supply, and treasury balance during launch.</p>
          <div className="actions">
            <button className="primary">Refresh metrics</button>
            <button className="secondary">Withdraw USDC</button>
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
