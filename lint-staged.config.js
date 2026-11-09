export default {
    "*.{ts,tsx,js,mjs}": ["eslint --max-warnings 0 --fix", "prettier --write"],
    "*.{json,md,yml,yaml,css}": ["prettier --write"],
};
