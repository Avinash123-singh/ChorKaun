import { Coins, ShoppingBag } from "lucide-react";
import ScreenShell from "../shared/ScreenShell";
import { useGame } from "../../state/gameStore";

const ITEMS = [
  { id: "coins50", name: "Coin Pack S", desc: "+50 bonus coins", price: 0, gain: 50 },
  { id: "coins200", name: "Coin Pack M", desc: "+200 coins", price: 100, gain: 200 },
  { id: "frame", name: "Gold Frame", desc: "Premium avatar border", price: 150, gain: 0 },
  { id: "theme", name: "Royal Theme", desc: "Lobby gold accents boost", price: 250, gain: 0 },
];

interface StoreScreenProps {
  onBack: () => void;
}

const StoreScreen = ({ onBack }: StoreScreenProps) => {
  const { state, spendCoins, addCoins } = useGame();

  const buy = (price: number, gain: number) => {
    if (price === 0) {
      addCoins(gain);
      return;
    }
    if (state.userProfile.coins < price) return;
    spendCoins(price);
    if (gain > 0) addCoins(gain);
  };

  return (
    <ScreenShell title="STORE" onBack={onBack}>
      <div className="flex flex-1 flex-col gap-4">
        <div className="flex items-center justify-between rounded-xl border border-[var(--gold-2)]/40 bg-[var(--gold-2)]/10 px-4 py-3">
          <span className="flex items-center gap-2 text-[13px] font-semibold text-white">
            <Coins size={16} className="text-[var(--gold-2)]" /> Your balance
          </span>
          <span className="font-display text-[18px] font-black text-[var(--gold-2)]">
            {state.userProfile.coins.toLocaleString()}
          </span>
        </div>

        {ITEMS.map((item) => (
          <div
            key={item.id}
            className="flex items-center justify-between gap-3 rounded-xl border border-[var(--border-soft)] bg-[var(--bg-panel-2)] px-4 py-3"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--purple-3)]/40">
                <ShoppingBag size={18} className="text-[var(--gold-2)]" />
              </div>
              <div>
                <p className="text-[13px] font-bold text-white">{item.name}</p>
                <p className="text-[11px] text-white/50">{item.desc}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => buy(item.price, item.gain)}
              disabled={item.price > 0 && state.userProfile.coins < item.price}
              className="rounded-full bg-gradient-to-r from-[var(--gold-2)] to-[var(--gold-3)] px-3 py-1.5 text-[11px] font-black text-[#241600] disabled:opacity-40"
            >
              {item.price === 0 ? "FREE" : `${item.price}`}
            </button>
          </div>
        ))}
      </div>
    </ScreenShell>
  );
};

export default StoreScreen;
