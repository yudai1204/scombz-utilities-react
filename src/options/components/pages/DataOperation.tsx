import { Box, Button, styled } from "@mui/material";
import { format } from "date-fns";
import { MdDownload, MdUpload, MdDelete } from "react-icons/md";
import { migrateLogic } from "~backgrounds/migration";
import type { Saves } from "~settings";
import { defaultSaves } from "~settings";

const VisuallyHiddenInput = styled("input")({
  clip: "rect(0 0 0 0)",
  clipPath: "inset(50%)",
  height: 1,
  overflow: "hidden",
  position: "absolute",
  bottom: 0,
  left: 0,
  whiteSpace: "nowrap",
  width: 1,
});

const saveStorage = (newSaves: Saves): Promise<Saves> => {
  return new Promise((resolve) => {
    chrome.storage.local.get(defaultSaves, (currentData: Saves) => {
      const mergedData = {
        settings: {
          ...currentData.settings,
          ...newSaves.settings,
        },
        scombzData: {
          ...currentData.scombzData,
          ...newSaves.scombzData,
        },
      };
      chrome.storage.local.set(mergedData, () => {
        resolve(mergedData);
      });
    });
  });
};

type Props = {
  saves: Saves;
  setSaves: (saves: Saves) => void;
};

export const DataOperation = (props: Props) => {
  const { saves, setSaves } = props;

  const importData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target.result as string) as Saves;
        if (
          data === null ||
          typeof data !== "object" ||
          data?.scombzData === undefined ||
          data?.settings === undefined
        ) {
          throw new Error("Invalid data");
        }
        saveStorage(data).then((_newSaves) => {
          alert("データの読み込みが完了しました。");
          window.location.reload();
        });
      } catch (error) {
        alert("ファイルの読み込みに失敗しました。");
      }
    };
    reader.readAsText(file);
  };

  const exportData = (_e) => {
    const data: Saves = {
      ...saves,
      settings: {
        ...saves.settings,
        loginData: {
          username: "",
          password: "",
        },
      },
    };
    const blob = new Blob([JSON.stringify(data)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const date = new Date();
    a.download = `scombz-utilities-data-${format(date, "yyyy-MM-dd-HH-mm")}.json`;
    a.click();
    setTimeout(() => {
      URL.revokeObjectURL(url);
    }, 1000);
  };

  const resetData = (_e) => {
    if (confirm("本当に初期化しますか？\nこの操作は取り消せません。")) {
      chrome.storage.local.clear(() => {
        window.location.reload();
      });
    }
  };

  const importLegacyData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target.result as string);
        console.log(data);
        if (data === null || typeof data !== "object") {
          throw new Error("Invalid data");
        }
        const newSaves = migrateLogic(data);
        saveStorage(newSaves).then((newSaves) => {
          setSaves(newSaves);
          alert("データの読み込みが完了しました。");
        });
      } catch (error) {
        alert("ファイルの読み込みに失敗しました。");
        console.error(error);
      }
    };
    reader.readAsText(file);
  };

  return (
    <>
      <h2>{chrome.i18n.getMessage("manageOptions")}</h2>
      <Box>
        <p>JSON形式で、設定やメモを一括で書き出したり、外部から読み込むことができます。</p>
        <p>パスワード及び学籍番号は出力されませんが、それ以外のものは全て出力されるため注意してください。</p>
      </Box>
      <Box m={1}>
        <h3>インポート</h3>
        <Button variant="contained" color="primary" sx={{ width: 200 }} component="label" startIcon={<MdUpload />}>
          {chrome.i18n.getMessage("import")}
          <VisuallyHiddenInput type="file" accept=".json" onChange={importData} />
        </Button>

        <h3>レガシー形式でインポート</h3>
        <Box my={1}>
          <p>以前のバージョンでエクスポートしたデータを読み込みます。</p>
          <p>この機能は将来的に削除される予定です。</p>
        </Box>
        <Button variant="contained" color="secondary" sx={{ width: 200 }} component="label" startIcon={<MdUpload />}>
          インポート
          <VisuallyHiddenInput type="file" accept=".json" onChange={importLegacyData} />
        </Button>

        <h3>エクスポート</h3>
        <Button variant="contained" color="primary" onClick={exportData} sx={{ width: 200 }} startIcon={<MdDownload />}>
          {chrome.i18n.getMessage("export")}
        </Button>

        <h3>リセット</h3>
        <Button variant="contained" color="error" onClick={resetData} sx={{ width: 200 }} startIcon={<MdDelete />}>
          設定を初期化する
        </Button>
      </Box>
    </>
  );
};
