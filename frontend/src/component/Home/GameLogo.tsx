const GameLogo = () => {
  return (
    <div className="flex flex-col items-center">
      {/* Crown */}
      <div className="relative z-10 mb-[-26px] h-[72px] w-[104px] overflow-hidden rounded-full drop-shadow-[0_5px_14px_rgba(255,190,30,0.45)]">
        <img src="/assets/crown.png" alt="Crown" className="absolute inset-0 h-full w-full object-cover" />
      </div>

      {/* Logo */}
      <div
        className="
          relative flex h-[128px] w-[300px] items-center justify-center rounded-full
          border-[3px] border-[#6F31A7] bg-gradient-to-b from-[#32115F] via-[#1C0C3B] to-[#0B061B]
          shadow-[0_15px_35px_rgba(80,25,140,0.4)]
        "
      >
        {/* Inner Border */}
        <div className="absolute inset-[7px] rounded-full border border-[#A052E5]/50" />

        {/* Logo Text */}
        <h1 className="font-display relative z-10 whitespace-nowrap text-[46px] font-extrabold leading-none tracking-tight text-gold-gradient">
          Chorkaun<span>?</span>
        </h1>
      </div>
    </div>
  );
};

export default GameLogo;
