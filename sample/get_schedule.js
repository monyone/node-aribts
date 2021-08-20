"use strict";

const fs = require("fs");
const util = require("util");
const aribts = require("../");
const TsStream = aribts.TsStream;
const TsUtil = aribts.TsUtil;

if (process.argv < 3) {
    console.error("Usage: node get_schedule.js /path/to/file.ts");
    process.exit(1);
}

const readStream = process.argv[2] === "-" ? process.stdin : fs.createReadStream(process.argv[2]);
const tsStream = new TsStream();

const tsUtil = new TsUtil();

readStream.pipe(tsStream);

tsStream.on("data", () => {});

tsStream.on("tot", (pid, data) => {
    tsUtil.addTot(pid, data);
});

tsStream.on("eit", (pid, data) => {
    if (pid !== 0x12) return;

    tsUtil.addEit(pid, data);

    if (data.table_id === 0x4E || data.table_id === 0x4F) return;

    let amount = tsUtil.getScheduleAmount();
    console.error("\u001b[2A");
    console.error(`Check - ${amount[1]} of ${amount[0]} [${Math.floor(amount[1] / amount[0] * 100)}%]`);

    if (!tsUtil.hasSchedule()) return;

    console.error("schedule", util.inspect(tsUtil.getSchedule(), {depth: null}));

    tsStream.removeAllListeners();
    readStream.unpipe(tsStream);
    tsStream.end();
});
