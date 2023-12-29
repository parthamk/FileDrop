import React from "react";
import ThemeBtn from "./ThemeBtn";
import { GithubIcon } from "lucide-react";
import { Button } from "./ui/button";
import Image from "next/image";
import fastDropDark from "../public/fastdrop.png"
import fastDropLight from "../public/fastdroplight.png"

const Navbar = () => {
  return (
    <div className="flex justify-center">
      <div className="flex border font-extrabold text-[24px] px-3 py-3 m-2 rounded-lg w-full items-center justify-between">
        <div className="flex justify-center items-center">
          <Image className="h-12 w-12 p-0 rotate-90 scale-0 hidden dark:flex dark:scale-100" src={fastDropLight} alt="fastdrop"/>
          <Image className="h-12 w-12 p-0 rotate-90 scale-100 flex dark:scale-0 dark:hidden" src={fastDropDark} alt="fastdrop"/>
          FastDrop
        </div>
        <div className="flex gap-x-2">
          <div>
            <Button type="button" className="p-3" variant="ghost">
              <GithubIcon size={18}/>
            </Button>
          </div>
          <div>
            <ThemeBtn />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Navbar;
