#target bridge
if (BridgeTalk.appName == "bridge") {
    RenDesc = new MenuElement("command", "Rename", "at the end of tools");
}

RenDesc.onSelect = function () {
    var folder = app.document.presentationPath; // 获取当前打开的文件夹
    if (folder == null) {
        alert("未选择文件夹，脚本终止。");
        return;
    }

    processFolder(new Folder(folder));
};

// 递归处理文件夹
function processFolder(folder) {
    var files = folder.getFiles();
    for (var i = 0; i < files.length; i++) {
        var file = files[i];
        if (file instanceof Folder) {
            processFolder(file);
        } else if (file instanceof File && file.name.match(/\.jpg$/i)) {
            processFile(file);
        }
    }
}

// 处理单个文件
function processFile(file) {
    var exif = readExifData(file);
    var dateTaken = exif.dateTaken || "NoDate";
    var title = exif.title || "NoTitle";
    var keywords = exif.keywords || "NoKeywords";

    var baseName = title + "_" + dateTaken + "_" + keywords;
    var newName = generateUniqueName(file.parent, baseName, "jpg");

    if (newName) {
        file.rename(newName);
    }
}

// 读取 EXIF 数据
function readExifData(file) {
    var exif = {
        dateTaken: null,
        title: "",
        keywords: ""
    };

    try {
        // 加载XMP库
        if (ExternalObject.AdobeXMPScript == undefined) {
            ExternalObject.AdobeXMPScript = new ExternalObject("lib:AdobeXMPScript");
        }

        var xmpFile = new XMPFile(file.fsName, XMPConst.UNKNOWN, XMPConst.OPEN_FOR_READ);
        var xmp = xmpFile.getXMP();

        // 读取Dublin Core属性
        if (xmp.doesPropertyExist(XMPConst.NS_DC, "title")) {
            var titleArray = [];
            var count = xmp.countArrayItems(XMPConst.NS_DC, "title");
            for (var i = 1; i <= count; i++) {
                titleArray.push(xmp.getArrayItem(XMPConst.NS_DC, "title", i).toString());
            }
            exif.title = titleArray.join(" ");
        }

        if (xmp.doesPropertyExist(XMPConst.NS_DC, "subject")) {
            var keywordsArray = [];
            var count = xmp.countArrayItems(XMPConst.NS_DC, "subject");
            for (var i = 1; i <= count; i++) {
                keywordsArray.push(xmp.getArrayItem(XMPConst.NS_DC, "subject", i).toString());
            }
            exif.keywords = keywordsArray.join("-");
        }

        if (xmp.doesPropertyExist(XMPConst.NS_EXIF, "DateTimeOriginal")) {
            exif.dateTaken = parseExifDate(xmp.getProperty(XMPConst.NS_EXIF, "DateTimeOriginal").toString());
        }

        xmpFile.closeFile(XMPConst.CLOSE_UPDATE_SAFELY);

    } catch (e) {
        alert("错误: " + e.message);
    }

    return exif;
}

// 解析 EXIF 日期
function parseExifDate(dateStr) {
    var parts = dateStr.slice(0, 10);
    if (parts) {
        return parts;
    }
    return null;
}


// 生成唯一的文件名
function generateUniqueName(folder, baseName, extension) {
    var count = 1;
    var newName = baseName + "_001." + extension;
    
    while (File(folder.fsName + "/" + newName).exists) {
        count++;
        var seq = "000" + count;
        seq = seq.substr(seq.length - 3);
        newName = baseName + "_" + seq + "." + extension;
    }
    return newName;
}