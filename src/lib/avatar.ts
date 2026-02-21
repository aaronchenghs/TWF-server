import {
  AVATAR_BASE,
  AVATAR_BODY_COUNT,
  AVATAR_MOUTH_COUNT,
  AVATAR_EYES_COUNT,
  type Avatar,
  type AvatarParts,
} from "@twf/contracts";

function randomPartIndex(count: number): number {
  return Math.floor(Math.random() * count);
}

function avatarFromParts(parts: AvatarParts): Avatar {
  const encoded = `${parts.body.toString(AVATAR_BASE)}.${parts.mouth.toString(
    AVATAR_BASE,
  )}.${parts.eyes.toString(AVATAR_BASE)}`;
  return encoded as Avatar;
}

export function createRandomAvatar(): Avatar {
  return avatarFromParts({
    body: randomPartIndex(AVATAR_BODY_COUNT),
    mouth: randomPartIndex(AVATAR_MOUTH_COUNT),
    eyes: randomPartIndex(AVATAR_EYES_COUNT),
  });
}
