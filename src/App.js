import * as React from "react";
import { Amplify, API, Auth } from "aws-amplify";
import { withAuthenticator } from "@aws-amplify/ui-react";
import "@aws-amplify/ui-react/styles.css";
import Box from "@mui/material/Box";
import Backdrop from "@mui/material/Backdrop";
import CircularProgress from "@mui/material/CircularProgress";
import Button from "@mui/material/Button";
import { Typography } from "@mui/material";
import TextField from "@mui/material/TextField";
import Radio from "@mui/material/Radio";
import RadioGroup from "@mui/material/RadioGroup";
import FormControlLabel from "@mui/material/FormControlLabel";
import FormControl from "@mui/material/FormControl";
import FormLabel from "@mui/material/FormLabel";

import AuctionGrid from "./AuctionGrid";

const apiUrl =
  "https://b0wz8hrznd.execute-api.ap-southeast-2.amazonaws.com/prod";

const awsConfig = {
  Auth: {
    region: "ap-southeast-2",
    userPoolId: "ap-southeast-2_Oem7grLHL",
    userPoolWebClientId: "42gqtaaqf3qs582uphjokvfatq",
    cookieStorage: {
      path: "/",
      expires: "",
      domain: window.location.hostname,
      secure: true,
    },
    oauth: {
      domain: "chimpin-reserve.auth.ap-southeast-2.amazoncognito.com",
      scope: [
        "phone",
        "email",
        "profile",
        "openid",
        "aws.cognito.signin.user.admin",
      ],
      redirectSignIn: `https://${window.location.hostname}/parseauth`,
      redirectSignOut: `https://${window.location.hostname}/`,
      responseType: "code",
    },
  },
  API: {
    endpoints: [
      {
        name: "reserve",
        endpoint: apiUrl,
        custom_header: async () => {
          return {
            Authorization: `Bearer ${(await Auth.currentSession())
              .getIdToken()
              .getJwtToken()}`,
          };
        },
      },
    ],
  },
};

Amplify.configure(awsConfig);

function ReserveMetRadioGroup({ reserveMet, setReserveMet }) {
  const onChange = React.useCallback(
    (event) => {
      setReserveMet(event.target.value);
    },
    [setReserveMet]
  );

  return (
    <FormControl>
      <FormLabel>Reserve Met</FormLabel>
      <RadioGroup defaultValue="0" value={reserveMet} onChange={onChange}>
        <FormControlLabel value="0" control={<Radio />} label="No Filter" />
        <FormControlLabel
          value="1"
          control={<Radio />}
          label="Hasn't Met Reserve"
          sx={{ color: "red" }}
        />
        <FormControlLabel
          value="2"
          control={<Radio />}
          label="Has Met Reserve"
          sx={{ color: "green" }}
        />
      </RadioGroup>
    </FormControl>
  );
}

const Filters = ({ search, setSearch, reserveMet, setReserveMet }) => {
  const [_search, _setSearch] = React.useState(search);
  const _changeTimeout = React.useRef(null);
  const onChangeSearch = React.useCallback(
    (event) => {
      const val = event.target.value;
      _setSearch(val);
      if (_changeTimeout.current !== null) {
        clearTimeout(_changeTimeout.current);
      }
      _changeTimeout.current = setTimeout(() => {
        setSearch(val);
      }, 250);
    },
    [setSearch]
  );

  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 5 }}>
      <TextField
        value={_search}
        label="Search"
        variant="standard"
        onChange={onChangeSearch}
      />
      <ReserveMetRadioGroup
        reserveMet={reserveMet}
        setReserveMet={setReserveMet}
      />
    </Box>
  );
};

const TimeDiff = ({ last, style }) => {
  const [now, setNow] = React.useState(new Date());
  React.useEffect(() => {
    const interval = setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);
  return (
    <Box style={style}>
      <Typography>
        Last loaded auction{" "}
        {Math.round((now.valueOf() - last.valueOf()) / 1000)} seconds ago
      </Typography>
    </Box>
  );
};

function ReactApp() {
  const [loading, setLoading] = React.useState(false);
  const [lastGot, setLastGot] = React.useState(null);
  const [listings, setListings] = React.useState([]);
  const [search, setSearch] = React.useState("");
  const [reserveMet, setReserveMet] = React.useState("0");

  const getCurrentAuction = React.useCallback(async () => {
    setLoading(true);
    setListings([]);
    const reqPerLoop = 3;
    let page = 1;
    while (page < 50) {
      const requests = [];
      for (let i = 0; i < page + reqPerLoop; i++) {
        requests.push(
          API.get("reserve", "/", {
            queryStringParameters: { page: page + i },
          })
            .then((body) => {
              return JSON.parse(body.body);
            })
            .catch((error) => {
              console.error(error);
              return [];
            })
        );
      }
      const nextListings = await Promise.all(requests).catch((error) => {
        console.error(error);
        return [];
      });
      let anyEmpty = true;
      if (nextListings.length > 0) {
        anyEmpty = false;
        const joined = nextListings.reduce((curJoined, listings) => {
          curJoined = curJoined.concat(listings);
          anyEmpty = anyEmpty || listings.length === 0;
          return curJoined;
        }, []);
        setListings((old) => {
          return [...old, ...joined];
        });
      }
      if (anyEmpty) {
        break;
      }
      page += reqPerLoop + 1;
    }
    setLoading(false);
    setLastGot(new Date());
  }, []);
  React.useEffect(() => {
    getCurrentAuction();
  }, [getCurrentAuction]);

  return (
    <Box
      sx={{
        flexGrow: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 5,
        margin: "20px",
      }}
    >
      <Backdrop
        sx={{ color: "#fff", zIndex: (theme) => theme.zIndex.drawer + 1 }}
        open={loading}
      >
        <CircularProgress color="inherit" />
      </Backdrop>
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 5,
        }}
      >
        <Button variant="contained" onClick={getCurrentAuction}>
          Reload Auction Data
        </Button>
        {lastGot !== null ? <TimeDiff last={lastGot} /> : null}
      </Box>
      <Filters
        search={search}
        setSearch={setSearch}
        reserveMet={reserveMet}
        setReserveMet={setReserveMet}
      />
      <AuctionGrid
        listings={listings}
        search={search}
        reserveMet={reserveMet}
        apiUrl={apiUrl}
      />
    </Box>
  );
}

export default withAuthenticator(ReactApp);
