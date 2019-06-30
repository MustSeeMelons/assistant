const TRIVIA_API_BASE = "https://opentdb.com/api.php";
const TRIVIA_API_TOKEN_BASE = "https://opentdb.com/api_token.php";

export const GET_OPTS = {
    timeout: 60000,
};

export const URLBuilder = {
    questionGet: (questionCount: number, token: string): string => {
        return `${TRIVIA_API_BASE}?amount=${questionCount}&token=${token}`;
    },
    tokenGet: () => {
        return `${TRIVIA_API_TOKEN_BASE}?command=request`;
    },
    tokenReset: (token: string) => {
        return `${TRIVIA_API_TOKEN_BASE}?command=reset&${token}`;
    },
};
