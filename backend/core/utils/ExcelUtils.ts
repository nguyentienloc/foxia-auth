import { isEmpty } from 'lodash';
import xlsx from 'node-xlsx';

export default class ExcelUtils {
  public static read = (
    file: Buffer,
    sheetIndex: number | string,
    index?: string,
    ignoreCountFirstRow = 1,
  ) => {
    const sheets = xlsx.parse(file);
    const parseData = [];
    let sheet;
    if (typeof sheetIndex === 'string') {
      sheet = sheets.find((i) => i.name === sheetIndex);
    } else {
      sheet = sheets[sheetIndex];
    }
    const data = sheet.data;
    const headers = data[0];
    let indexNumber = null;
    if (index) {
      indexNumber = headers.findIndex((i) => i === index);
      if (indexNumber < 0) {
        indexNumber = null;
      }
    }
    let currentIndex = -1;
    for (const row of data.splice(
      ignoreCountFirstRow,
      data.length,
    ) as unknown[][]) {
      if (indexNumber === null) {
        const parsedRow: Record<string, any> = {};
        for (let i = 0; i < row.length; i++) {
          parsedRow[headers[i]] = row[i];
        }
        if (!isEmpty(parsedRow)) parseData.push(parsedRow);
      } else {
        if (row[indexNumber]) {
          parseData.push({});
          currentIndex++;
        }
        const parsedRow: Record<string, any> = parseData[currentIndex];
        for (let i = 0; i < row.length; i++) {
          if (!row[i]) {
            continue;
          }
          if (parsedRow[headers[i]]) {
            parsedRow[headers[i]].push(row[i]);
          } else {
            parsedRow[headers[i]] = [row[i]];
          }
        }
      }
    }
    for (const parsedRow of parseData) {
      for (const rowkey of Object.keys(parsedRow)) {
        if (parsedRow[rowkey]?.length === 1) {
          parsedRow[rowkey] = parsedRow[rowkey][0];
        }
      }
    }
    return parseData;
  };

  public static groupData(data: any[]) {
    const result = [];
    let currentItem = null;

    for (const item of data) {
      if (item['ID'] !== undefined) {
        currentItem = {
          id: item['ID'],
          name: item['Tên nhân viên'],
          email: item['Tài khoản đăng nhập'],
          position: item['Chức vụ'],
          roles: [item['Nhóm quyền']].filter(Boolean),
          teams: [item['Đội ngũ (Quét update sau khi tạo đội ngũ)']].filter(
            Boolean,
          ),
        };
        result.push(currentItem);
      } else if (currentItem) {
        if (item['Nhóm quyền']) currentItem.roles.push(item['Nhóm quyền']);
        if (item['Đội ngũ (Quét update sau khi tạo đội ngũ)'])
          currentItem.teams.push(
            item['Đội ngũ (Quét update sau khi tạo đội ngũ)'],
          );
      }
    }

    return result;
  }
}
