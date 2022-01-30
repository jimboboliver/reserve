import * as React from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import Paper from "@mui/material/Paper";

function openInNewTab(url) {
  var win = window.open(url, "_blank");
  win.focus();
}

const Listing = ({
  style,
  apiUrl,
  listing: { thumb_image, name, current_bid, url, reserve_met },
}) => {
  const goToLot = React.useCallback(() => openInNewTab(url), [url]);

  return (
    <Paper
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        minWidth: "320px",
        padding: "3px",
        ...style,
      }}
      elevation={3}
    >
      <img src={apiUrl + "/image" + thumb_image} alt={name} style={{}} />
      <Typography align="center">{name}</Typography>
      <Typography color={reserve_met ? "green" : "red"}>
        $ {current_bid}
      </Typography>
      <Button variant="contained" onClick={goToLot}>
        VIEW LOT
      </Button>
    </Paper>
  );
};

export default function AuctionGrid({ listings, search, reserveMet, apiUrl }) {
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
            curItems.push(
              <Listing
                listing={listing}
                apiUrl={apiUrl}
                style={{ flex: 0.2 }}
                key={listing.id}
              />
            );
          }
          return curItems;
        }, []),
    [listings, search, reserveMet, apiUrl]
  );

  return (
    <Box>
      <Typography>
        {listings.length} in auction. {gridItems.length} after filters.
      </Typography>
      <Box
        style={{
          maxWidth: 1000,
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "center",
          gap: "1px",
        }}
      >
        {gridItems}
      </Box>
    </Box>
  );
}
