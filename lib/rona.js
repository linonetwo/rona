const fs = require("fs");
const re_normal = /^(const|let|var)\s+(\w+)\s+=(\s*require\((.\w+.))\)(;|)$/gim; // const name = require("name");
const re_unique = /^(const|let|var)\s+(\w+)\s+=\s+require\((.+?)\).(\w+)(;|)$/gim; // const Bob = require("name").first
const re_special = /^(const|let|var)\s+\{\s*(\w+.+)\s*}\s+=\s+require\((.+?)\)(;|)$/gim; // const { name } = require("name")
const re_direct = /^require\((.+?)\)(;|)$/gim; // require("things")
const re_invoked = /^(const|let|var)\s*(\w+)\s*=(\s*require\((.\w+.))\)\(\)(;|)$/gim; // const name = require("person")()
const re_unique_invoked = /^(const|let|var)\s+(\w+)\s+=\s+require\((.+?)\).(\w+)\(\)(;|)$/gim; // const something = require("things").something()
// Go deeper no matter how project is structured and get all files with real path
const files = [];
basedir = process.argv[3];

// This function will return list of all files in all directories and subdirectories
let deeper = (dir, filelist) => {
  filelist = filelist || [];

  // if a given path resolves to a file return that file and exit
  if (fs.statSync(dir).isFile()) {
    filelist.push(dir);
    return filelist;
  }
  f = fs.readdirSync(dir);
  dir = fs.realpathSync(dir);

  f.forEach(file => {
    file = dir + "\\" + file;
    if (fs.statSync(file).isDirectory()) {
      filelist = deeper(file, filelist);
    } else {
      if (
        (file.includes(".js") && !file.includes(".json")) ||
        file.includes("_bak")
      )
        filelist.push(file);
    }
  });
  return filelist;
};

let rona = new Promise((resolve, reject) => {
  try {
    const allfiles = resolve(deeper(basedir, files));
    return allfiles;
  } catch (error) {
    console.log("path is required: $rona --path <Path Name>");
    process.exit(1);
  }
});

// go over each line in a file if a match is found append it to a backup file
const transform = file => {
  fs.writeFileSync(
    file,
    fs
      .readFileSync(file, "utf-8")
      .replace(re_normal, `import $2 from $4`)
      .replace(re_direct, `import $1`)
      .replace(re_unique, `import { $4 as $2 } from $3`)
      .replace(re_invoked, `import $2 from $4`)
      .replace(re_unique_invoked, `import { $4 } from $3`)
      .replace(re_special, `import { $2 } from $3`)
  );
};
module.exports = {
  rona,
  transform
};
