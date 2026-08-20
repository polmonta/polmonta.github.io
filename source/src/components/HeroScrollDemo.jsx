"use client";
import React from "react";
import { ContainerScroll } from "./ui/container-scroll-animation";

export function HeroScrollDemo() {
  return (
    <div className="flex flex-col overflow-hidden -mt-40 -mb-60 md:-mb-96">
      <ContainerScroll
        titleComponent={null}
      >
        <img
          src="/img/global.jpeg"
          alt="ManageState App Interface"
          className="mx-auto rounded-2xl object-cover h-full w-full scale-110"
          draggable={false}
        />
      </ContainerScroll>
    </div>
  );
}
