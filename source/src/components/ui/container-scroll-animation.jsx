"use client";
import React, { useRef, useState, useEffect } from "react";
import { useScroll, useTransform, useReducedMotion, motion as Motion } from "framer-motion";

export const ContainerScroll = ({
    titleComponent,
    children,
}) => {
    const containerRef = useRef(null);
    const { scrollYProgress } = useScroll({
        target: containerRef,
    });
    const [isMobile, setIsMobile] = useState(false);
    const shouldReduceMotion = useReducedMotion();

    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth <= 768);
        };
        checkMobile();
        window.addEventListener("resize", checkMobile);
        return () => {
            window.removeEventListener("resize", checkMobile);
        };
    }, []);

    const scaleDimensions = () => {
        return isMobile ? [0.7, 0.9] : [1.05, 1];
    };

    const rotate = useTransform(scrollYProgress, [0, 1], [20, 0]);
    const scale = useTransform(scrollYProgress, [0, 1], scaleDimensions());
    const translate = useTransform(scrollYProgress, [0, 1], [0, -100]);

    return (
        <div
            className="h-[60rem] md:h-[80rem] flex items-start justify-center relative p-2 py-20 md:p-20"
            ref={containerRef}
        >
            <div
                className="py-10 md:py-40 w-full relative"
                style={{
                    perspective: "1000px",
                }}
            >
                <Header translate={translate} titleComponent={titleComponent} reducedMotion={shouldReduceMotion} />
                <Card rotate={rotate} translate={translate} scale={scale} reducedMotion={shouldReduceMotion}>
                    {children}
                </Card>
            </div>
        </div>
    );
};

export const Header = ({ translate, titleComponent, reducedMotion = false }) => {
    return (
        <Motion.div
            style={{
                ...(reducedMotion ? {} : { translateY: translate }),
            }}
            className="div max-w-5xl mx-auto text-center"
        >
            {titleComponent}
        </Motion.div>
    );
};

export const Card = ({
    rotate,
    scale,
    children,
    reducedMotion = false,
}) => {
    return (
        <Motion.div
            style={{
                ...(reducedMotion ? {} : { rotateX: rotate, scale }),
                boxShadow:
                    "0 0 #0000004d, 0 9px 20px #0000004a, 0 37px 37px #00000042, 0 84px 50px #00000026, 0 149px 60px #0000000a, 0 233px 65px #00000003",
            }}
            className="max-w-[300px] md:max-w-[360px] -mt-12 mx-auto h-[600px] md:h-[750px] w-full border-4 border-[#202020] p-2 bg-[#111111] rounded-[40px] shadow-2xl"
        >
            <div className="h-full w-full overflow-hidden rounded-[25px] bg-gray-100 dark:bg-zinc-900 md:p-2">
                {children}
            </div>
        </Motion.div>
    );
};
