import Image from "next/image";
import Login from "@/components/Login/Intro";
export default function LoginIntro() {
  return (
    <div className="flex flex-col flex-1 items-center justify-center bg-zinc-50 font-sans bg-white">
      <Login />
    </div>
  );
}
