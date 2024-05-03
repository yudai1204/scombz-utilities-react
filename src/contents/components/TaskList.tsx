import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  styled,
  ButtonGroup,
  IconButton,
  Pagination,
  Collapse,
} from "@mui/material";
import { grey, red } from "@mui/material/colors";
import type { SxProps } from "@mui/system";
import { differenceInHours, differenceInMinutes, format } from "date-fns";
import { ja } from "date-fns/locale";
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { HiOutlineSwitchHorizontal } from "react-icons/hi";
import { IoMdEyeOff } from "react-icons/io";
import { MdKeyboardArrowUp, MdKeyboardArrowDown, MdAdd } from "react-icons/md";
import type { Subject } from "../types/subject";
import type { Task } from "../types/task";
import { defaultSaves } from "../util/settings";
import type { Saves } from "../util/settings";

const getTaskColor = (
  task: Task,
): {
  backgroundColor: string;
  color: string;
  fontWeight: number;
} => {
  const deadlineInHours = differenceInHours(new Date(task.deadline), new Date());
  if (deadlineInHours < 6) return { backgroundColor: red[200], color: red[900], fontWeight: 600 };
  if (deadlineInHours < 12) return { backgroundColor: red[100], color: red[900], fontWeight: 600 };
  if (deadlineInHours < 24) return { backgroundColor: red[50], color: red[900], fontWeight: 600 };
  if (deadlineInHours < 72) return { backgroundColor: "inherit", color: red[900], fontWeight: 400 };
  if (deadlineInHours < 24 * 7) return { backgroundColor: "inherit", color: "inherit", fontWeight: 400 };
  return { backgroundColor: "inherit", color: grey[500], fontWeight: 400 };
};

const TaskTypography = styled(Typography)(() => ({
  display: "block",
  textWrap: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
  fontWeight: 400,
  letterSpacing: 0,
}));

type TaskTableCellProps = {
  children: React.ReactNode;
  sx?: SxProps;
  href?: string;
};
const TaskTableCell = (props: TaskTableCellProps) => {
  const { children, sx = {}, href } = props;
  if (href)
    return (
      <TableCell align="left" sx={{ padding: "4px 8px" }}>
        <a href={href} style={{ textDecoration: "none", color: "inherit" }}>
          <TaskTypography
            variant="caption"
            sx={{
              "&:hover": { textDecoration: "underline" },
              borderRadius: 1,
              padding: "1px",
              ...sx,
            }}
          >
            {children}
          </TaskTypography>
        </a>
      </TableCell>
    );
  return (
    <TableCell align="left" sx={{ padding: "4px 8px" }}>
      <TaskTypography variant="caption" sx={sx}>
        {children}
      </TaskTypography>
    </TableCell>
  );
};

const getRelativeTime = (date: Date, now: Date): string => {
  const diff = differenceInMinutes(date, now);
  if (diff < 180) return `残り約${diff}分`;
  if (diff < 1440) return `残り約${Math.floor(diff / 60)}時間`;
  return `残り約${Math.floor(diff / 1440)}日`;
};

type TaskTableProps = {
  tasklist: Task[];
  subjects: Subject[];
  nowDate: Date;
  formatStr: string;
  isRelativeTime: boolean;
  highlightTask: boolean;
  toggleRelativeTime: () => void;
  width: number;
  rowsPerPage: number;
  addHiddenTaskId: (id: string) => void;
};
const TaskTable = (props: TaskTableProps) => {
  const {
    tasklist,
    subjects,
    nowDate,
    formatStr,
    isRelativeTime,
    highlightTask,
    toggleRelativeTime,
    width,
    rowsPerPage,
    addHiddenTaskId,
  } = props;
  const [page, setPage] = useState(0);

  const displayTaskList = useMemo(
    () => tasklist.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage),
    [tasklist, page],
  );

  const handleChange = useCallback(
    (_event: React.ChangeEvent<unknown>, value: number) => {
      setPage(value - 1);
    },
    [setPage],
  );

  const hideTask = useCallback(
    (task: Task) => {
      if (confirm(`課題『${task.title}』を非表示にしますか？`)) {
        addHiddenTaskId(task.id);
      }
    },
    [addHiddenTaskId],
  );

  return (
    <>
      {tasklist.length > displayTaskList.length ? (
        <Box display="flex" alignItems="center" justifyContent="space-between" px={1}>
          <Typography variant="caption" sx={{ display: "block", opacity: 0.7 }}>
            {page * rowsPerPage + 1} - {Math.min(page * rowsPerPage + rowsPerPage, tasklist.length)} / {tasklist.length}
          </Typography>
          <Pagination
            size="small"
            count={Math.ceil(tasklist.length / rowsPerPage)}
            page={page + 1}
            onChange={handleChange}
            showFirstButton
            showLastButton
            color="primary"
            sx={{ mb: "5px", width: "fit-content" }}
          />
        </Box>
      ) : (
        <Box height="5px" />
      )}
      <Paper>
        <TableContainer>
          <Table size="small" aria-label="a dense table">
            <TableHead>
              <TableRow>
                {width > 880 && <TaskTableCell>科目</TaskTableCell>}
                <TaskTableCell>課題名</TaskTableCell>
                <TaskTableCell>
                  <Box
                    onClick={toggleRelativeTime}
                    sx={{ cursor: "pointer", userSelect: "none", display: "flex", alignItems: "center", gap: "2px" }}
                  >
                    <Typography display="block" fontSize="0.75rem">
                      期限
                    </Typography>
                    <Box display="flex" fontSize="0.75rem" alignItems="center" sx={{ opacity: 0.5 }}>
                      <HiOutlineSwitchHorizontal />
                    </Box>
                  </Box>
                </TaskTableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {tasklist.length === 0 && (
                <TableRow>
                  <TaskTableCell sx={{ width: "100%" }}>課題はありません</TaskTableCell>
                </TableRow>
              )}
              {displayTaskList.map((task, index) => {
                const courseUrl = subjects.find((subject) => subject.name === task.course)?.url;
                const colors = highlightTask ? getTaskColor(task) : {};
                return (
                  <TableRow
                    key={task.id + index}
                    sx={{
                      "&:last-child td, &:last-child th": { border: 0 },
                      position: "relative",
                      maxWidth: "100%",
                      ...colors,
                    }}
                  >
                    {width > 880 && (
                      <TaskTableCell sx={{ ...colors, maxWidth: "110px" }} href={courseUrl}>
                        {task.course}
                      </TaskTableCell>
                    )}
                    <TaskTableCell
                      sx={{ ...colors, maxWidth: width > 880 ? "calc(100vw - 610px)" : "calc(100vw - 480px)" }}
                      href={task.link}
                    >
                      {task.title}
                    </TaskTableCell>
                    <TaskTableCell sx={{ ...colors, width: "113px" }}>
                      <Box onClick={toggleRelativeTime}>
                        {isRelativeTime
                          ? getRelativeTime(task.deadlineDate, nowDate)
                          : format(task.deadlineDate, formatStr, { locale: ja })}
                      </Box>
                    </TaskTableCell>
                    <IconButton
                      size="small"
                      sx={{ position: "absolute", right: "1px", top: "3px", opacity: 0.4, "&:hover": { opacity: 1 } }}
                      onClick={() => hideTask(task)}
                    >
                      <IoMdEyeOff fontSize={15} />
                    </IconButton>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </>
  );
};

type Props = {
  width: number;
};
export const TaskList = (props: Props) => {
  const { width } = props;
  const [isTaskListOpen, setIsTaskListOpen] = useState<boolean>(true);
  const [isRelativeTime, setIsRelativeTime] = useState<boolean>(true);
  const [tasklist, setTasklist] = useState<Task[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [nowDate, setNowDate] = useState<Date>();
  const [formatStr, setFormatStr] = useState<string>("yyyy/MM/dd HH:mm");
  const [highlightTask, setHighlightTask] = useState<boolean>(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [hiddenTaskIdList, setHiddenTaskIdList] = useState<string[]>([]);

  const toggleOpen = useCallback(() => {
    setIsTaskListOpen(!isTaskListOpen);
  }, [isTaskListOpen]);

  const toggleRelativeTime = useCallback(() => {
    setIsRelativeTime(!isRelativeTime);
    const save = async () => {
      const currentData = (await chrome.storage.local.get(defaultSaves)) as Saves;
      currentData.settings.deadlineMode = isRelativeTime ? "absolute" : "relative";
      chrome.storage.local.set(currentData);
    };
    save();
  }, [isRelativeTime]);

  useEffect(() => {
    const fetchTasklist = async () => {
      const currentData = (await chrome.storage.local.get(defaultSaves)) as Saves;
      setSubjects(currentData.settings.notifySurveySubjects);
      setFormatStr(currentData.settings.deadlineFormat);
      setIsRelativeTime(currentData.settings.deadlineMode === "relative");
      setHighlightTask(currentData.settings.highlightTask);
      setLastUpdate(new Date(currentData.scombzData.lastTaskFetchUnixTime));
      setRowsPerPage(currentData.settings.taskListRowsPerPage);

      const normalTaskList = currentData.scombzData.tasklist;

      const notifySurveySubjectsName = currentData.settings.notifySurveySubjects.map((subject) => subject.name);
      const allSurveyList = currentData.scombzData.surveyList;
      const surveyList = allSurveyList.filter((task) => notifySurveySubjectsName.includes(task.course));

      const originalTasklist = currentData.scombzData.originalTasklist;

      const now = new Date();

      const combinedTaskList = [...normalTaskList, ...surveyList, ...originalTasklist]
        .map((task) => {
          return { ...task, deadlineDate: new Date(task.deadline) };
        })
        .filter((task) => task.deadlineDate >= now)
        .filter((task) => !currentData.settings.hiddenTaskIdList.includes(task.id));

      combinedTaskList.sort((x, y) => {
        const [a, b] = [x.deadlineDate, y.deadlineDate];
        return a.getTime() - b.getTime();
      });

      setTasklist(combinedTaskList);
      setHiddenTaskIdList(currentData.settings.hiddenTaskIdList);
    };
    fetchTasklist();
    setNowDate(new Date());
    setInterval(() => {
      setNowDate(new Date());
    }, 30000);
  }, []);

  useEffect(() => {
    if (hiddenTaskIdList.length === 0 || tasklist.length === 0) return;
    const newTaskList = tasklist.filter((task) => !hiddenTaskIdList.includes(task.id));
    setTasklist(newTaskList);
    const saveHiddenTaskIdList = async () => {
      const currentData = (await chrome.storage.local.get(defaultSaves)) as Saves;
      currentData.settings.hiddenTaskIdList = hiddenTaskIdList.filter((id) =>
        tasklist.map((task) => task.id).includes(id),
      );
      chrome.storage.local.set(currentData);
    };
    saveHiddenTaskIdList();
  }, [hiddenTaskIdList]);

  const addHiddenTaskId = useCallback(
    (taskId: string) => {
      setHiddenTaskIdList([...hiddenTaskIdList, taskId]);
    },
    [hiddenTaskIdList],
  );

  if (width < 540) {
    return <></>;
  }

  return (
    <>
      <Box
        maxWidth="1200px"
        m={width > 1540 ? "10px auto" : "10px"}
        onClick={(e) => e.stopPropagation()}
        sx={{
          backgroundColor: "#fff9",
          backdropFilter: "blur(6px)",
          padding: 1,
          borderRadius: 1,
        }}
      >
        <Box position="relative" display="flex" alignItems="center">
          <Typography variant="h6" sx={{ px: 0.5, textAlign: "left", fontSize: "16px" }}>
            課題一覧
          </Typography>
          <Typography variant="caption" sx={{ px: 0.5, textAlign: "left", fontSize: "12px", opacity: 0.7 }}>
            (最終更新: {format(lastUpdate, "MM/dd HH:mm")})
          </Typography>
          <ButtonGroup sx={{ position: "absolute", top: 0, right: 0 }}>
            <IconButton size="small">
              <MdAdd />
            </IconButton>
            <IconButton onClick={toggleRelativeTime} size="small">
              <HiOutlineSwitchHorizontal />
            </IconButton>
            <IconButton onClick={toggleOpen} size="small">
              {isTaskListOpen ? <MdKeyboardArrowUp /> : <MdKeyboardArrowDown />}
            </IconButton>
          </ButtonGroup>
        </Box>
        <Collapse in={isTaskListOpen} timeout="auto">
          <TaskTable
            {...{
              tasklist,
              subjects,
              nowDate,
              formatStr,
              isRelativeTime,
              highlightTask,
              toggleRelativeTime,
              width,
              rowsPerPage,
              addHiddenTaskId,
            }}
          />
        </Collapse>
      </Box>
    </>
  );
};
