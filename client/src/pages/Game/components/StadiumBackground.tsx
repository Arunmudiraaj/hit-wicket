function StadiumBackground() {
  return (
    <>
      <img
        src="/cricket-stadium.svg"
        alt="Stadium"
        className="absolute inset-0 w-full h-full object-cover pointer-events-none select-none opacity-20 dark:opacity-10"
      />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 20%, rgba(0,0,0,0.2) 60%, rgba(0,0,0,0.5) 100%)",
        }}
      />
    </>
  );
}

export default StadiumBackground;