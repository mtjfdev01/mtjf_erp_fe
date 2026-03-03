const MOV_BLOCK_HEADER = '[MOV CHECKLIST]';

export const splitDescriptionAndMov = (text) => {
  const raw = String(text || '');
  const index = raw.indexOf(MOV_BLOCK_HEADER);
  if (index === -1) {
    return {
      baseDescription: raw.trim(),
      movItems: [],
    };
  }
  const baseDescription = raw.slice(0, index).trimEnd();
  const remainder = raw.slice(index + MOV_BLOCK_HEADER.length);
  const lines = remainder
    .split(/\r?\n/)
    .map((line) => String(line || '').trim())
    .filter((line) => line.length > 0);
  const movItems = lines.map((line) => {
    let value = line;
    if (value.startsWith('- ')) value = value.slice(2);
    else if (value.startsWith('* ')) value = value.slice(2);
    return value.trim();
  }).filter((value) => value.length > 0);
  return {
    baseDescription,
    movItems,
  };
};

export const encodeMovIntoDescription = (description, movItems) => {
  const cleanItems = Array.isArray(movItems)
    ? movItems
        .map((text) => String(text || '').trim())
        .filter((text) => text.length > 0)
    : [];
  const { baseDescription } = splitDescriptionAndMov(description);
  if (!cleanItems.length) {
    return baseDescription;
  }
  const lines = cleanItems.map((item) => `- ${item}`).join('\n');
  if (!baseDescription) {
    return `${MOV_BLOCK_HEADER}\n${lines}`;
  }
  return `${baseDescription}\n\n${MOV_BLOCK_HEADER}\n${lines}`;
};

