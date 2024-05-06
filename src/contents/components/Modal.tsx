import { Box, Card, IconButton, Typography } from "@mui/material";
import { MdClose } from "react-icons/md";
type Props = {
  title: string;
  children: React.ReactNode;
  isOpen: boolean;
  setIsOpen: (value: boolean) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onClose?: (res?: any) => void;
};
export const Modal = (props: Props) => {
  const { title, children, isOpen: open, setIsOpen, onClose = () => {} } = props;

  const close = (e) => {
    e.stopPropagation();
    onClose();
    setIsOpen(false);
  };

  return (
    <Box
      sx={{
        display: open ? "flex" : "none",
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        zIndex: 1000,
        justifyContent: "center",
        alignItems: "center",
      }}
      onClick={close}
    >
      <Card sx={{ width: 720, padding: 1, overflow: "visible" }} onClick={(e) => e.stopPropagation()}>
        <Box display="flex" justifyContent="center" sx={{ position: "relative", p: 0.5 }}>
          <IconButton onClick={close} sx={{ position: "absolute", right: 0, top: 0 }}>
            <MdClose />
          </IconButton>
          <Typography variant="h6" sx={{ textAlign: "center" }}>
            {title}
          </Typography>
        </Box>
        {children}
      </Card>
    </Box>
  );
};
