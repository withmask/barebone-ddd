const set = new Set(['a', 'b', 'c']),
  b = new Set(['a', 'd', 'c']);

function uniqueElements(sets) {
  const result = {};
  const elementFrequency = new Map();

  // Step 1: Calculate the frequency of each element across all sets
  Object.values(sets).forEach((set) => {
    set.forEach((item) => {
      elementFrequency.set(item, (elementFrequency.get(item) || 0) + 1);
    });
  });

  // Step 2: For each set, find elements that appear only once in total
  Object.keys(sets).forEach((setId) => {
    const uniqueInCurrent = new Set();
    sets[setId].forEach((item) => {
      if (elementFrequency.get(item) === 1) {
        uniqueInCurrent.add(item);
      }
    });
    result[setId] = uniqueInCurrent;
  });

  return result;
}

console.log(uniqueElements({ set, b }));
