import { Clock3, UserRoundPlus, UsersRound } from "lucide-react";

interface GameActionsProps {
  onCreateRoom?: () => void;
  onJoinRoom?: () => void;
  onPlayOnline?: () => void;
}

const GameActions = ({ onCreateRoom, onJoinRoom, onPlayOnline }: GameActionsProps) => {
  return (
    <div className="flex w-full flex-col gap-3">
      <button
        type="button"
        onClick={onPlayOnline}
        className="
          group flex w-full items-center gap-4 rounded-2xl bg-gradient-to-r from-[#FFC82E] to-[#F4A900]
          px-5 py-3 text-left shadow-[0_6px_15px_rgba(255,180,20,0.15)]
          transition duration-200 hover:scale-[1.015] active:scale-[0.98]
        "
      >
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/20">
          <Clock3 size={28} strokeWidth={2.5} className="text-[#332000]" />
        </div>
        <div>
          <p className="text-base font-black text-[#241600]">PLAY ONLINE</p>
          <p className="text-xs font-medium text-[#5E4100]">Quick match with 4 players</p>
        </div>
      </button>

      <button
        type="button"
        onClick={onCreateRoom}
        className="
          flex w-full items-center gap-4 rounded-2xl bg-gradient-to-r from-[#7424D3] to-[#5420A8]
          px-5 py-3 text-left shadow-[0_6px_15px_rgba(110,40,220,0.2)]
          transition duration-200 hover:scale-[1.015] active:scale-[0.98]
        "
      >
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/15">
          <UsersRound size={27} className="text-white" />
        </div>
        <div>
          <p className="text-base font-bold text-white">CREATE ROOM</p>
          <p className="text-xs text-purple-200">Host a private 4-player room</p>
        </div>
      </button>

      <button
        type="button"
        onClick={onJoinRoom}
        className="
          flex w-full items-center gap-4 rounded-2xl bg-gradient-to-r from-[#25A63D] to-[#16852F]
          px-5 py-3 text-left shadow-[0_6px_15px_rgba(20,150,50,0.18)]
          transition duration-200 hover:scale-[1.015] active:scale-[0.98]
        "
      >
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/15">
          <UserRoundPlus size={27} className="text-white" />
        </div>
        <div>
          <p className="text-base font-bold text-white">JOIN ROOM</p>
          <p className="text-xs text-green-100">Join with Room Code</p>
        </div>
      </button>
    </div>
  );
};

export default GameActions;
