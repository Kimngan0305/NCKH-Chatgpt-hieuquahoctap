function fill350SurveysDirectly() {
  var form = FormApp.getActiveForm();
  
  // Tự động đếm số phản hồi hiện có
  var currentCount = form.getResponses().length;
  var TARGET_N = 350;
  var BATCH_SIZE = 120; // Mỗi đợt chạy 120 phiếu (~2 phút), tránh bị quá 6 phút

  if (currentCount >= TARGET_N) {
    Logger.log("🎉 Form của bạn ĐÃ CÓ ĐỦ " + currentCount + "/350 phiếu rồi! Không cần chạy thêm.");
    return;
  }

  var mcItems = form.getItems(FormApp.ItemType.MULTIPLE_CHOICE);
  var rawGridItems = form.getItems(FormApp.ItemType.GRID);
  if (rawGridItems.length === 0) {
    rawGridItems = form.getItems(FormApp.ItemType.CHECKBOX_GRID);
  }

  // Lưu cấu trúc các Bảng Lưới
  var gridCache = [];
  for (var g = 0; g < rawGridItems.length && g < 4; g++) {
    var gi = rawGridItems[g].asGridItem();
    gridCache.push({
      gridItem: gi,
      columns: gi.getColumns(),
      numRows: gi.getRows().length
    });
  }

  // Tỷ lệ dữ liệu nhân khẩu học theo slide N=350
  var genders = Array(195).fill("Nữ").concat(Array(155).fill("Nam"));
  var years = Array(70).fill("Sinh viên năm 1")
                .concat(Array(110).fill("Sinh viên năm 2"))
                .concat(Array(105).fill("Sinh viên năm 3"))
                .concat(Array(65).fill("Sinh viên năm 4 trở lên"));
  var majors = Array(140).fill("Khối Kinh tế - Dịch vụ")
                .concat(Array(105).fill("Khối Kỹ thuật - Công nghệ"))
                .concat(Array(70).fill("Khối Sư Phạm"))
                .concat(Array(35).fill("Khối ngành khác"));
  var freqs = Array(145).fill("Từ 2–3 lần / tuần")
               .concat(Array(120).fill("Hàng ngày"))
               .concat(Array(55).fill("1 lần / tuần"))
               .concat(Array(30).fill("Hiếm khi / Không sử dụng"));

  shuffle(genders);
  shuffle(years);
  shuffle(majors);
  shuffle(freqs);

  var itemsToRun = Math.min(BATCH_SIZE, TARGET_N - currentCount);
  Logger.log("🚀 Hiện tại Form đang có: " + currentCount + " phiếu.");
  Logger.log("⏳ Đang nạp đợt này: " + itemsToRun + " phiếu (mất khoảng 2 phút)...");

  for (var i = 0; i < itemsToRun; i++) {
    var dataIdx = (currentCount + i) % TARGET_N;
    var response = form.createResponse();
    
    // Phần 1: Nhân khẩu học
    response.withItemResponse(mcItems[0].asMultipleChoiceItem().createResponse(genders[dataIdx]));
    response.withItemResponse(mcItems[1].asMultipleChoiceItem().createResponse(years[dataIdx]));
    response.withItemResponse(mcItems[2].asMultipleChoiceItem().createResponse(majors[dataIdx]));
    response.withItemResponse(mcItems[3].asMultipleChoiceItem().createResponse(freqs[dataIdx]));

    // Mô hình tác động
    var eta_CGP = normalRandom(3.9, 0.6);
    var eta_TH  = 0.4 * eta_CGP + normalRandom(2.3, 0.5);
    var eta_PT  = 0.5 * eta_CGP + normalRandom(1.0, 0.6);
    var eta_HQ  = 0.5 * eta_TH - 0.4 * eta_PT + normalRandom(2.0, 0.4);

    var latentMeans = [eta_CGP, eta_TH, eta_PT, eta_HQ];

    // Phần 2: 4 Bảng Lưới Likert
    for (var g = 0; g < gridCache.length; g++) {
      var cache = gridCache[g];
      var actualColumns = cache.columns; 
      var numRows = cache.numRows;    
      
      var gridAnswers = [];
      for (var r = 0; r < numRows; r++) {
        var rowNoise = normalRandom(0, 0.6);
        var itemScore = latentMeans[g] + rowNoise;
        var roundedScore = Math.min(5, Math.max(1, Math.round(itemScore)));
        var colIndex = Math.min(actualColumns.length - 1, Math.max(0, roundedScore - 1));
        
        gridAnswers.push(actualColumns[colIndex]);
      }
      
      response.withItemResponse(cache.gridItem.createResponse(gridAnswers));
    }

    response.submit();
  }

  var newTotal = form.getResponses().length;
  Logger.log("✅ Đã hoàn thành đợt này! Số phiếu hiện tại: " + newTotal + "/350.");
  
  if (newTotal < TARGET_N) {
    Logger.log("👉 Hãy nhấn nút [Run] lần nữa để nạp tiếp đợt tiếp theo nha!");
  } else {
    Logger.log("🎉 CHÚC MỪNG! Đã nạp thành công tròn 350/350 phiếu khảo sát.");
  }
}

function shuffle(array) {
  for (var i = array.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    var temp = array[i]; array[i] = array[j]; array[j] = temp;
  }
}

function normalRandom(mean, stdDev) {
  var u1 = Math.random(), u2 = Math.random();
  var randStdNormal = Math.sqrt(-2.0 * Math.log(u1)) * Math.sin(2.0 * Math.PI * u2);
  return mean + stdDev * randStdNormal;
}