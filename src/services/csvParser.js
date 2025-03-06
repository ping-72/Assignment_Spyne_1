import fs from "fs";
import csv from "csv-parser";
import stream from "stream";

class CSVParserService {
  async parseCSV(filePath) {
    return new Promise((resolve, reject) => {
      const results = [];

      const fileStream = fs.createReadStream(filePath);

      fileStream
        .pipe(csv())
        .on("data", (data) => {
          // Validate and transform CSV data
          const processedData = {
            productName: data["Product Name"]?.trim(),
            inputUrls: data["Input Image Urls"]
              ?.split(",")
              .map((url) => url.trim())
              .filter((url) => url), // Remove empty URLs
          };
          console.log("Processed Data:", processedData);

          if (processedData.productName && processedData.inputUrls.length > 0) {
            console.log("CSV parsed successfully");
            results.push(processedData);
          }
        })
        .on("end", () => {
          resolve(results);
        })
        .on("error", (error) => {
          reject(error);
        });
    });
  }
}

export default new CSVParserService();
