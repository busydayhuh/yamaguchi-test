import { gsap } from "gsap";
import { Observer } from "gsap/Observer";
import "./style.css";

gsap.registerPlugin(Observer);

fetch(`${import.meta.env.BASE_URL}svg-sprite.svg`)
  .then((res) => res.text())
  .then((svg) => {
    document.body.insertAdjacentHTML("afterbegin", svg);
  });

const mm = gsap.matchMedia();

mm.add("(min-width: 1200px)", () => {
  const slides = gsap.utils.toArray(".slide");
  const wheelRing = document.querySelector(".wheel__ring");
  const wheelItems = gsap.utils.toArray(".wheel__item");

  if (!slides.length || !wheelRing || !wheelItems.length) return;

  const radius = 354;
  const angleStep = 18;

  let activeIndex = 0;
  let isAnimating = false;
  let slideTween = null;

  gsap.set(slides, {
    autoAlpha: 0,
    x: 120,
  });

  gsap.set(slides[0], {
    autoAlpha: 1,
    x: 0,
  });

  function getLoopIndex(index) {
    return gsap.utils.wrap(0, slides.length, index);
  }

  function getWheelSlot(itemIndex, currentIndex) {
    const total = slides.length;
    let diff = itemIndex - currentIndex;

    if (diff > total / 2) diff -= total;
    if (diff < -total / 2) diff += total;

    return diff;
  }

  function setWheel(index) {
    wheelItems.forEach((item, itemIndex) => {
      const slot = getWheelSlot(itemIndex, index);
      const angle = slot * angleStep;
      const radians = (angle * Math.PI) / 180;
      const x = Math.cos(radians) * radius;
      const y = Math.sin(radians) * radius;

      item.classList.toggle("wheel__item--active", itemIndex === index);
      item.toggleAttribute("aria-current", itemIndex === index);

      gsap.to(item, {
        x,
        y,
        xPercent: -50,
        yPercent: -50,
        scale: itemIndex === index ? 1.06 : 0.84,
        autoAlpha: Math.abs(slot) > 1 ? 0 : 1,
        duration: 0.45,
        ease: "power3.out",
      });
    });

    gsap.to(wheelRing, {
      rotation: -index * angleStep,
      duration: 0.45,
      ease: "power3.out",
    });
  }

  function setSlide(nextIndex, direction = 1) {
    nextIndex = getLoopIndex(nextIndex);

    if (nextIndex === activeIndex || isAnimating) return;

    isAnimating = true;

    const previousIndex = activeIndex;

    slides[previousIndex].classList.remove("slide--active");
    slides[previousIndex].setAttribute("aria-hidden", "true");

    slides[nextIndex].classList.add("slide--active");
    slides[nextIndex].removeAttribute("aria-hidden");

    slideTween?.kill();

    slideTween = gsap
      .timeline({
        onComplete: () => {
          activeIndex = nextIndex;
          isAnimating = false;
        },
      })
      .to(
        slides[previousIndex],
        {
          autoAlpha: 0,
          x: -120 * direction,
          duration: 0.42,
          ease: "power2.inOut",
        },
        0,
      )
      .fromTo(
        slides[nextIndex],
        {
          autoAlpha: 0,
          x: 120 * direction,
        },
        {
          autoAlpha: 1,
          x: 0,
          duration: 0.5,
          ease: "power3.out",
        },
        0.06,
      );

    setWheel(nextIndex);
  }

  setWheel(activeIndex);

  const observer = Observer.create({
    target: window,
    type: "wheel,touch,pointer",
    preventDefault: true,
    tolerance: 12,
    wheelSpeed: -1,

    onDown: () => {
      setSlide(activeIndex + 1, 1);
    },

    onUp: () => {
      setSlide(activeIndex - 1, -1);
    },
  });

  wheelItems.forEach((item) => {
    item.addEventListener("click", () => {
      const nextIndex = Number(item.dataset.slideTo);
      const slot = getWheelSlot(nextIndex, activeIndex);
      const direction = slot >= 0 ? 1 : -1;

      setSlide(nextIndex, direction);
    });
  });

  return () => {
    observer.kill();
    slideTween?.kill();

    gsap.set([slides, wheelItems, wheelRing], {
      clearProps: "all",
    });
  };
});
