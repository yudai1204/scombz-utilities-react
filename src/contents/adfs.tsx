import createCache from "@emotion/cache";
import { CacheProvider } from "@emotion/react";
import { LoadingButton } from "@mui/lab";
import {
  Button,
  FormControl,
  Link,
  Stack,
  Box,
  Typography,
  InputLabel,
  Input,
  InputAdornment,
  IconButton,
  Snackbar,
  Alert,
} from "@mui/material";

import type { PlasmoCSConfig } from "plasmo";
import React, { useEffect } from "react";
import { MdVisibility, MdVisibilityOff, MdCloseFullscreen, MdOpenInFull } from "react-icons/md";
import { adfsLogic } from "./util/adfsLogic";
import { defaultSaves } from "./util/settings";

export const config: PlasmoCSConfig = {
  matches: ["https://adfs.sic.shibaura-it.ac.jp/*"],
  run_at: "document_end",
};

const openSettings = () => {
  chrome.runtime.sendMessage({ type: "open_settings" });
};

const SaveDialog = () => {
  const [showPassword, setShowPassword] = React.useState(false);
  const [open, setOpen] = React.useState(true);
  const [isLoading, setIsLoading] = React.useState(false);
  const [openSnackbar, setOpenSnackbar] = React.useState(false);
  const idRef = React.useRef<HTMLElement>();
  const passRef = React.useRef<HTMLElement>();

  const handleClickShowPassword = () => setShowPassword((show) => !show);

  const handleMouseDownPassword = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
  };

  const closeDialog = () => {
    setOpen(false);
  };

  const saveUser = async () => {
    setIsLoading(true);
    const userId = idRef.current?.querySelector("input")?.value;
    const userPass = passRef.current?.querySelector("input")?.value;
    if (userId && userPass && userId.match(/^[A-z]{2}[0-9]{5}(@sic)?$/)) {
      const currentData = await chrome.storage.local.get(defaultSaves);
      console.log(currentData);
      currentData.settings.loginData.username = userId.match(/^[A-z]{2}[0-9]{5}$/) ? userId + "@sic" : userId;
      currentData.settings.loginData.password = userPass;
      await chrome.storage.local.set(currentData);
      document.getElementById("userNameInput")?.setAttribute("value", currentData.settings.loginData.username);
      document.getElementById("passwordInput")?.setAttribute("value", userPass);
      setInterval(() => {
        document.getElementById("submitButton")?.click();
      }, 500);
    } else {
      setOpenSnackbar(true);
      setTimeout(() => {
        setIsLoading(false);
      }, 500);
    }
  };

  return (
    <>
      <Snackbar
        open={openSnackbar}
        autoHideDuration={3000}
        onClose={() => setOpenSnackbar(false)}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
      >
        <Alert severity="error">
          <Typography variant={"subtitle1"}>学籍番号またはパスワードが正しくありません。</Typography>
        </Alert>
      </Snackbar>
      <Stack
        width={420}
        bgcolor={"white"}
        padding={2}
        position={"fixed"}
        bottom={50}
        right={20}
        border={"1px solid #ccc"}
        borderRadius={2}
      >
        {open ? (
          <form>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 3,
                justifyContent: "start",
                px: 1,
                position: "relative",
              }}
            >
              <img src={chrome.runtime.getURL("assets/logo.webp")} width={48} height={48} />
              <Box>
                <Typography variant="subtitle2">
                  ScombZ Utilitiesに保存すると自動ログインできます。
                  <br />
                  保存したログイン情報は
                  <Link href="#" onClick={openSettings}>
                    設定
                  </Link>
                  から変更できます。
                </Typography>
                <Typography color={"gray"} variant="caption">
                  ※設定はPC本体のみに保存されます。
                </Typography>
              </Box>
            </Box>
            <Stack gap={0.5} mb={2}>
              <FormControl sx={{ mt: 1 }} variant="outlined">
                <InputLabel htmlFor="scombz-utilities-username">Username</InputLabel>
                <Input size="small" id="scombz-utilities-username" ref={idRef} />
              </FormControl>
              <FormControl sx={{ mt: 1 }} variant="outlined">
                <InputLabel htmlFor="scombz-utilities-password">Password</InputLabel>
                <Input
                  id="scombz-utilities-password"
                  ref={passRef}
                  type={showPassword ? "text" : "password"}
                  endAdornment={
                    <InputAdornment position="end">
                      <IconButton onClick={handleClickShowPassword} onMouseDown={handleMouseDownPassword}>
                        {showPassword ? <MdVisibilityOff /> : <MdVisibility />}
                      </IconButton>
                    </InputAdornment>
                  }
                />
              </FormControl>
            </Stack>
            <Box sx={{ display: "flex" }}>
              <Box sx={{ display: "flex", alignItems: "center" }}>
                <IconButton onClick={closeDialog} id="scombz-utilities-close">
                  <MdCloseFullscreen />
                </IconButton>
                <label htmlFor="scombz-utilities-close">
                  <Typography variant={"subtitle1"} color={"gray"}>
                    閉じる
                  </Typography>
                </label>
              </Box>
              <Box sx={{ mr: 0, ml: "auto", display: "flex", alignItems: "center", gap: 2, justifyContent: "start" }}>
                <Button variant={"outlined"} onClick={openSettings}>
                  設定
                </Button>
                <LoadingButton
                  variant={"contained"}
                  color={"primary"}
                  loading={isLoading}
                  onClick={saveUser}
                  type="submit"
                >
                  保存
                </LoadingButton>
              </Box>
            </Box>
          </form>
        ) : (
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <IconButton onClick={() => setOpen(true)} id="scombz-utilities-open">
              <MdOpenInFull />
            </IconButton>
            <label htmlFor="scombz-utilities-open">
              <Typography variant={"subtitle1"}>ここを開いてScombZ Utilitiesに保存</Typography>
            </label>
          </Box>
        )}
      </Stack>
    </>
  );
};

const styleElement = document.createElement("style");

const styleCache = createCache({
  key: "plasmo-mui-cache",
  prepend: true,
  container: styleElement,
});

export const getStyle = () => styleElement;

const Adfs = () => {
  useEffect(() => {
    adfsLogic();
  }, []);

  return document.getElementById("userNameInput") && document.getElementById("passwordInput") ? (
    <CacheProvider value={styleCache}>
      <SaveDialog />
    </CacheProvider>
  ) : (
    <></>
  );
};

export default Adfs;
