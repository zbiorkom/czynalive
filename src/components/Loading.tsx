import { Alert, Box, Button, CircularProgress } from "@mui/material";

export const Loading = () => (
    <Box sx={{ display: "grid", placeItems: "center", minHeight: "40dvh" }}>
        <CircularProgress />
    </Box>
);

export const ErrorBox = ({ error, onRetry }: { error: Error; onRetry?: () => void }) => (
    <Alert
        severity="error"
        sx={{ m: 2 }}
        action={
            onRetry && (
                <Button color="inherit" size="small" onClick={onRetry}>
                    Odśwież
                </Button>
            )
        }
    >
        Coś poszło nie tak... ({error.message})
    </Alert>
);
