import * as React from "react";
import Amplify, { API, Auth } from "aws-amplify";
import { withAuthenticator } from "@aws-amplify/ui-react";
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

function openInNewTab(url) {
  var win = window.open(url, "_blank");
  win.focus();
}

const Listing = ({
  style,
  listing: { thumb_image, name, current_bid, url },
}) => {
  const goToLot = React.useCallback(() => openInNewTab(url), [url]);

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        minWidth: "320px",
        ...style,
      }}
    >
      <img src={apiUrl + "/image" + thumb_image} alt={name} style={{}} />
      <Typography align="center">{name}</Typography>
      <Typography>$ {current_bid}</Typography>
      <Button variant="contained" onClick={goToLot}>
        VIEW LOT
      </Button>
    </Box>
  );
};

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
        />
        <FormControlLabel
          value="2"
          control={<Radio />}
          label="Has Met Reserve"
        />
      </RadioGroup>
    </FormControl>
  );
}

const Filters = ({ search, setSearch, reserveMet, setReserveMet }) => {
  const onChangeSearch = React.useCallback(
    (event) => {
      setSearch(event.target.value);
    },
    [setSearch]
  );
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 5 }}>
      <TextField
        value={search}
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

const TimeDiff = ({ last }) => {
  const [now, setNow] = React.useState(new Date());
  React.useEffect(() => {
    const interval = setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);
  return (
    <Typography>
      Last loaded auction {Math.round((now.valueOf() - last.valueOf()) / 1000)}{" "}
      seconds ago
    </Typography>
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
    let page = 1;
    while (page < 50) {
      const queryStringParameters = { page };
      const nextListings = await API.get("reserve", "/", {
        queryStringParameters,
      })
        .then((body) => {
          return JSON.parse(body.body);
        })
        .catch((error) => {
          console.error(error);
          return [];
        });
      if (nextListings.length > 0) {
        setListings((old) => {
          return [...old, ...nextListings];
        });
      } else {
        break;
      }
      page += 1;
    }
    setLoading(false);
    setLastGot(new Date());
  }, []);
  React.useEffect(() => {
    getCurrentAuction();
  }, [getCurrentAuction]);

  const gridItems = React.useMemo(
    () =>
      listings
        .sort(({ aCurrentBid }, { bCurrentBid }) => {
          if (aCurrentBid > bCurrentBid) {
            return 1;
          } else if (aCurrentBid === bCurrentBid) {
            return 0;
          }
          return -1;
        })
        .reduce((curItems, listing) => {
          let passes = true;
          if (search.length > 0) {
            passes =
              passes &&
              listing.name
                .trim()
                .toLowerCase()
                .includes(search.trim().toLowerCase());
          }
          if (reserveMet !== "0") {
            passes =
              passes && listing.reserve_met === !!(parseInt(reserveMet) - 1);
          }
          if (passes) {
            curItems.push(<Listing listing={listing} style={{ flex: 0.25 }} />);
          }
          return curItems;
        }, []),
    [listings, search, reserveMet]
  );

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
      <Box
        style={{
          maxWidth: 1000,
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "center",
        }}
      >
        {gridItems}
      </Box>
    </Box>
  );
}

export default withAuthenticator(ReactApp);
