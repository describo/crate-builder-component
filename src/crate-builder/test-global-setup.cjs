const esbuild = require("esbuild");
const path = require("path");

module.exports = async () => {
    await esbuild.build({
        entryPoints: [
            path.join(__dirname, "crate-manager.js"),
            path.join(__dirname, "profile-manager.js"),
        ],
        format: "cjs",
        bundle: true,
        write: true,
        outExtension: { ".js": ".bundle.js" },
        outdir: __dirname,
    });
};
