import { describe, expect, it } from 'vitest';
import de from '../de.json';
import en from '../en.json';
import tr from '../tr.json';

type Messages = { [key: string]: string | Messages };

/** Flattens nested messages to `Namespace.key` paths. */
const flatten = (messages: Messages, prefix = ''): Record<string, string> =>
  Object.fromEntries(
    Object.entries(messages).flatMap(([key, value]) =>
      typeof value === 'string'
        ? [[`${prefix}${key}`, value]]
        : Object.entries(flatten(value, `${prefix}${key}.`)),
    ),
  );

/** Top level ICU arguments and rich text tags, for example {count} and <link>. */
const argumentsOf = (message: string) => {
  const names = new Set<string>();
  let depth = 0;
  for (const match of message.matchAll(/[{}]|<\/?(\w+)>/g)) {
    if (match[0] === '{') {
      depth += 1;
      const name = /^\{\s*(\w+)/.exec(message.slice(match.index))?.[1];
      if (depth === 1 && name) names.add(name);
    } else if (match[0] === '}') depth -= 1;
    else if (match[1]) names.add(`<${match[1]}>`);
  }
  return [...names].sort();
};

/** En dash and em dash, written as code points so this file contains neither. */
const LONG_DASHES = [String.fromCodePoint(0x2013), String.fromCodePoint(0x2014)];

const english = flatten(en);

describe.each([
  ['Turkish', flatten(tr)],
  ['German', flatten(de)],
])('%s messages', (_, translated) => {
  it('have exactly the English keys', () => {
    expect(Object.keys(translated).sort()).toEqual(Object.keys(english).sort());
  });

  it('use the same arguments and tags as English', () => {
    const mismatches = Object.entries(english).filter(([key, message]) => {
      const other = translated[key];
      return other !== undefined && argumentsOf(other).join() !== argumentsOf(message).join();
    });

    expect(mismatches.map(([key]) => key)).toEqual([]);
  });

  it('contain no long dashes', () => {
    expect(
      Object.values(translated).filter((message) =>
        LONG_DASHES.some((dash) => message.includes(dash)),
      ),
    ).toEqual([]);
  });
});
