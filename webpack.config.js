const path = require("path");

const mode = process.env.NODE_ENV || "production";

module.exports = {
    output: {
        filename: `worker.${mode}.js`,
        path: path.join(__dirname, "dist"),
    },
    mode,
    resolve: {
        extensions: [".ts", ".tsx", ".js"],
        plugins: [],
        alias: {
            ["~"]: path.resolve(`${__dirname}/src`),
        },
    },
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                loader: "ts-loader",
                options: {
                    transpileOnly: true,
                },
            },
            {
                test: /\.html$/,
                use: [
                    {
                        loader: "raw-loader",
                    },
                ],
            },
        ],
    },
};
