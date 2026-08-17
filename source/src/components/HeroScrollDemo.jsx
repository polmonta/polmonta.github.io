import { ContainerScroll } from './ui/container-scroll-animation';

export function HeroScrollDemo() {
  return (
    <div className="hero__visual hero__visual--screenshot flex flex-col overflow-hidden -mt-40 -mb-60 md:-mb-96" data-legacy-scroll-demo>
      <ContainerScroll titleComponent={null}>
        <div className="relative h-full w-full">
          <img
            src="/hero-tilted.png"
            alt="ManageState dashboard showing rental property finances and portfolio performance"
            width="1024"
            height="540"
            className="mx-auto rounded-2xl object-cover h-full w-full scale-110"
            loading="lazy"
            decoding="async"
            draggable={false}
          />
          <img
            src="/img/legacy-app-mockup.jpg"
            alt="ManageState app screen for tracking rental property finances"
            width="1024"
            height="1024"
            className="hero__legacy-shot absolute right-2 bottom-2 w-1/4 rounded-2xl border-4 border-gray-900 shadow-2xl"
            loading="lazy"
            decoding="async"
            draggable={false}
          />
        </div>
      </ContainerScroll>
    </div>
  );
}
