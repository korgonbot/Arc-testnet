const NFT_ABI = [
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function owner() view returns (address)",
  "function totalSupply() view returns (uint256)",
  "function MAX_SUPPLY() view returns (uint256)",
  "function publicMintOpen() view returns (bool)",
  "function gtdMintOpen() view returns (bool)",
  "function publicPrice() view returns (uint256)",
  "function gtdPrice() view returns (uint256)",
  "function maxPerWallet() view returns (uint256)",
  "function usdc() view returns (address)",
  "function publicMint(uint256) payable",
  "function gtdMint(uint256) payable",
  "function setPublicMint(bool)",
  "function setGTDMint(bool)",
  "function pause()",
  "function unpause()",
  "function ownerMint(address,uint256)",
  "function withdrawUSDC()"
];

const USDC_ABI = [
  "function allowance(address,address) view returns (uint256)",
  "function approve(address,uint256) returns (bool)"
];

const MARKETPLACE_ABI = [
  "function listItem(address,uint256,uint256)",
  "function cancelListing(address,uint256)",
  "function buyItem(address,uint256)",
  "function listings(address,uint256) view returns (address seller, uint256 price, bool active)"
];

let provider;
let signer;
let nft;
let usdc;
let marketplace;
let contractAddress;
let walletAddress;
let ownerAddress;

const ui = {
  connectButton: document.getElementById("connectButton"),
  refreshButton: document.getElementById("refreshButton"),
  contractInput: document.getElementById("contractAddress"),
  walletAddress: document.getElementById("walletAddress"),
  networkName: document.getElementById("networkName"),
  ownerBadge: document.getElementById("ownerBadge"),
  supplyBadge: document.getElementById("supplyBadge"),
  contractName: document.getElementById("contractName"),
  contractSymbol: document.getElementById("contractSymbol"),
  publicPrice: document.getElementById("publicPrice"),
  gtdPrice: document.getElementById("gtdPrice"),
  maxPerWallet: document.getElementById("maxPerWallet"),
  usdcAddress: document.getElementById("usdcAddress"),
  approveButton: document.getElementById("approveButton"),
  allowanceButton: document.getElementById("allowanceButton"),
  mintButton: document.getElementById("mintButton"),
  gtdMintButton: document.getElementById("gtdMintButton"),
  ownerActions: document.getElementById("ownerActions"),
  setPublicButton: document.getElementById("setPublicButton"),
  setGtdButton: document.getElementById("setGtdButton"),
  pauseButton: document.getElementById("pauseButton"),
  unpauseButton: document.getElementById("unpauseButton"),
  ownerMintButton: document.getElementById("ownerMintButton"),
  marketplaceAddress: document.getElementById("marketplaceAddress"),
  marketNftAddress: document.getElementById("marketNftAddress"),
  marketTokenId: document.getElementById("marketTokenId"),
  marketPrice: document.getElementById("marketPrice"),
  listItemButton: document.getElementById("listItemButton"),
  cancelListingButton: document.getElementById("cancelListingButton"),
  buyItemButton: document.getElementById("buyItemButton"),
  statusLog: document.getElementById("statusLog")
};

function log(message) {
  ui.statusLog.textContent = `${new Date().toLocaleTimeString()} — ${message}`;
}

function formatAddress(value) {
  if (!value) return "—";
  return `${value.slice(0, 6)}…${value.slice(-4)}`;
}

function setBusy(button, busy) {
  button.disabled = busy;
  button.style.opacity = busy ? "0.65" : "1";
}

async function ensureWallet() {
  if (!window.ethereum) {
    log("MetaMask is not installed. Please install it to continue.");
    return false;
  }

  if (!provider) {
    provider = new ethers.BrowserProvider(window.ethereum);
  }

  try {
    const accounts = await provider.send("eth_requestAccounts", []);
    signer = await provider.getSigner();
    walletAddress = await signer.getAddress();
    ui.walletAddress.textContent = walletAddress;
    const network = await provider.getNetwork();
    ui.networkName.textContent = network.chainName || network.chainId.toString();
    log(`Connected ${formatAddress(walletAddress)}`);
    return true;
  } catch (error) {
    log(`Wallet connection failed: ${error.message}`);
    return false;
  }
}

async function loadContract() {
  contractAddress = ui.contractInput.value.trim();
  if (!contractAddress) {
    log("Please enter a contract address.");
    return false;
  }

  nft = new ethers.Contract(contractAddress, NFT_ABI, signer || provider);

  try {
    const [name, symbol, owner, totalSupply, maxSupply, publicPriceValue, gtdPriceValue, maxPerWalletValue, usdcAddressValue] = await Promise.all([
      nft.name(),
      nft.symbol(),
      nft.owner(),
      nft.totalSupply(),
      nft.MAX_SUPPLY(),
      nft.publicPrice(),
      nft.gtdPrice(),
      nft.maxPerWallet(),
      nft.usdc()
    ]);

    ownerAddress = owner;
    ui.contractName.textContent = name;
    ui.contractSymbol.textContent = symbol;
    ui.publicPrice.textContent = ethers.formatUnits(publicPriceValue, 6);
    ui.gtdPrice.textContent = ethers.formatUnits(gtdPriceValue, 6);
    ui.maxPerWallet.textContent = maxPerWalletValue.toString();
    ui.usdcAddress.textContent = formatAddress(usdcAddressValue);
    ui.ownerBadge.textContent = formatAddress(owner);
    ui.supplyBadge.textContent = `${totalSupply.toString()} / ${maxSupply.toString()}`;
    ui.ownerActions.classList.toggle("visible", walletAddress?.toLowerCase() === owner.toLowerCase());
    log(`Loaded ${name} at ${formatAddress(contractAddress)}`);
    usdc = new ethers.Contract(usdcAddressValue, USDC_ABI, signer || provider);
    return true;
  } catch (error) {
    log(`Unable to read contract: ${error.message}`);
    return false;
  }
}

async function approveUsdc() {
  if (!(await ensureWallet())) return;
  if (!(await loadContract())) return;
  setBusy(ui.approveButton, true);
  try {
    const parsedAmount = ethers.parseUnits("1", 6);
    const tx = await usdc.approve(contractAddress, parsedAmount);
    await tx.wait();
    log(`USDC approval submitted: ${tx.hash}`);
  } catch (error) {
    log(`Approval failed: ${error.message}`);
  } finally {
    setBusy(ui.approveButton, false);
  }
}

async function checkAllowance() {
  if (!(await ensureWallet())) return;
  if (!(await loadContract())) return;
  setBusy(ui.allowanceButton, true);
  try {
    const allowance = await usdc.allowance(walletAddress, contractAddress);
    log(`Allowance: ${allowance.toString()}`);
  } catch (error) {
    log(`Allowance check failed: ${error.message}`);
  } finally {
    setBusy(ui.allowanceButton, false);
  }
}

async function publicMint() {
  if (!(await ensureWallet())) return;
  if (!(await loadContract())) return;
  setBusy(ui.mintButton, true);
  try {
    const tx = await nft.publicMint(1);
    await tx.wait();
    log(`Public mint succeeded: ${tx.hash}`);
    await loadContract();
  } catch (error) {
    log(`Public mint failed: ${error.message}`);
  } finally {
    setBusy(ui.mintButton, false);
  }
}

async function gtdMint() {
  if (!(await ensureWallet())) return;
  if (!(await loadContract())) return;
  setBusy(ui.gtdMintButton, true);
  try {
    const tx = await nft.gtdMint(1);
    await tx.wait();
    log(`GTD mint succeeded: ${tx.hash}`);
    await loadContract();
  } catch (error) {
    log(`GTD mint failed: ${error.message}`);
  } finally {
    setBusy(ui.gtdMintButton, false);
  }
}

async function togglePublicMint() {
  if (!(await ensureWallet())) return;
  if (!(await loadContract())) return;
  setBusy(ui.setPublicButton, true);
  try {
    const isOpen = await nft.publicMintOpen();
    const tx = await nft.setPublicMint(!isOpen);
    await tx.wait();
    log(`Public mint toggled to ${!isOpen}`);
    await loadContract();
  } catch (error) {
    log(`Public mint toggle failed: ${error.message}`);
  } finally {
    setBusy(ui.setPublicButton, false);
  }
}

async function toggleGtdMint() {
  if (!(await ensureWallet())) return;
  if (!(await loadContract())) return;
  setBusy(ui.setGtdButton, true);
  try {
    const isOpen = await nft.gtdMintOpen();
    const tx = await nft.setGTDMint(!isOpen);
    await tx.wait();
    log(`GTD mint toggled to ${!isOpen}`);
    await loadContract();
  } catch (error) {
    log(`GTD mint toggle failed: ${error.message}`);
  } finally {
    setBusy(ui.setGtdButton, false);
  }
}

async function pauseContract() {
  if (!(await ensureWallet())) return;
  if (!(await loadContract())) return;
  setBusy(ui.pauseButton, true);
  try {
    const tx = await nft.pause();
    await tx.wait();
    log(`Contract paused: ${tx.hash}`);
    await loadContract();
  } catch (error) {
    log(`Pause failed: ${error.message}`);
  } finally {
    setBusy(ui.pauseButton, false);
  }
}

async function unpauseContract() {
  if (!(await ensureWallet())) return;
  if (!(await loadContract())) return;
  setBusy(ui.unpauseButton, true);
  try {
    const tx = await nft.unpause();
    await tx.wait();
    log(`Contract unpaused: ${tx.hash}`);
    await loadContract();
  } catch (error) {
    log(`Unpause failed: ${error.message}`);
  } finally {
    setBusy(ui.unpauseButton, false);
  }
}

async function ownerMintOne() {
  if (!(await ensureWallet())) return;
  if (!(await loadContract())) return;
  setBusy(ui.ownerMintButton, true);
  try {
    const tx = await nft.ownerMint(walletAddress, 1);
    await tx.wait();
    log(`Owner mint succeeded: ${tx.hash}`);
    await loadContract();
  } catch (error) {
    log(`Owner mint failed: ${error.message}`);
  } finally {
    setBusy(ui.ownerMintButton, false);
  }
}

ui.connectButton.addEventListener("click", async () => {
  await ensureWallet();
  await loadContract();
});

ui.refreshButton.addEventListener("click", async () => {
  if (walletAddress) {
    await loadContract();
  } else {
    log("Connect your wallet first.");
  }
});

ui.approveButton.addEventListener("click", approveUsdc);
ui.allowanceButton.addEventListener("click", checkAllowance);
ui.mintButton.addEventListener("click", publicMint);
ui.gtdMintButton.addEventListener("click", gtdMint);
ui.setPublicButton.addEventListener("click", togglePublicMint);
ui.setGtdButton.addEventListener("click", toggleGtdMint);
ui.pauseButton.addEventListener("click", pauseContract);
ui.unpauseButton.addEventListener("click", unpauseContract);
ui.ownerMintButton.addEventListener("click", ownerMintOne);
ui.listItemButton.addEventListener("click", async () => {
  if (!(await ensureWallet())) return;
  const marketplaceAddress = ui.marketplaceAddress.value.trim();
  if (!marketplaceAddress) {
    log("Enter a marketplace address.");
    return;
  }
  const nftAddress = ui.marketNftAddress.value.trim();
  const tokenId = BigInt(ui.marketTokenId.value || 0);
  const price = BigInt(ui.marketPrice.value || 0) * 10n ** 6n;
  setBusy(ui.listItemButton, true);
  try {
    marketplace = new ethers.Contract(marketplaceAddress, MARKETPLACE_ABI, signer);
    const tx = await marketplace.listItem(nftAddress, tokenId, price);
    await tx.wait();
    log(`Listed token ${tokenId} for ${price.toString()} USDC.`);
  } catch (error) {
    log(`List failed: ${error.message}`);
  } finally {
    setBusy(ui.listItemButton, false);
  }
});
ui.cancelListingButton.addEventListener("click", async () => {
  if (!(await ensureWallet())) return;
  const marketplaceAddress = ui.marketplaceAddress.value.trim();
  if (!marketplaceAddress) {
    log("Enter a marketplace address.");
    return;
  }
  const nftAddress = ui.marketNftAddress.value.trim();
  const tokenId = BigInt(ui.marketTokenId.value || 0);
  setBusy(ui.cancelListingButton, true);
  try {
    marketplace = new ethers.Contract(marketplaceAddress, MARKETPLACE_ABI, signer);
    const tx = await marketplace.cancelListing(nftAddress, tokenId);
    await tx.wait();
    log(`Canceled listing for token ${tokenId}.`);
  } catch (error) {
    log(`Cancel failed: ${error.message}`);
  } finally {
    setBusy(ui.cancelListingButton, false);
  }
});
ui.buyItemButton.addEventListener("click", async () => {
  if (!(await ensureWallet())) return;
  const marketplaceAddress = ui.marketplaceAddress.value.trim();
  if (!marketplaceAddress) {
    log("Enter a marketplace address.");
    return;
  }
  const nftAddress = ui.marketNftAddress.value.trim();
  const tokenId = BigInt(ui.marketTokenId.value || 0);
  setBusy(ui.buyItemButton, true);
  try {
    marketplace = new ethers.Contract(marketplaceAddress, MARKETPLACE_ABI, signer);
    const tx = await marketplace.buyItem(nftAddress, tokenId);
    await tx.wait();
    log(`Bought token ${tokenId}.`);
  } catch (error) {
    log(`Buy failed: ${error.message}`);
  } finally {
    setBusy(ui.buyItemButton, false);
  }
});

window.addEventListener("load", () => {
  log("Ready. Connect your wallet and load a deployed Arc NFT contract.");
});
