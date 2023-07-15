import CardProfile, { BaseProfile } from "./card_profile";

test(`Cast from BaseProfile to CardProfile`, () => {
  const baseProfile: BaseProfile = {
    hp: 1,
    speed: 1,
    energy: 1,
    theta: 1,
    xi: 1,
    phi: 1,
    omega: 1,
    delta: 1,
    psi: 1,
  };
  const expectedProfile: CardProfile = {
    armour: 0,
    shield: 0,
    pointDefense: 0,
    hp: 1,
    speed: 1,
    energy: 1,
    theta: 1,
    xi: 1,
    phi: 1,
    omega: 1,
    delta: 1,
    psi: 1,
    handCardLimit: 0,
  };
  expect(CardProfile.fromBaseProfile(baseProfile)).toStrictEqual(
    expectedProfile,
  );
});
