export const callAgent = (req, res) => {
  try {
    res.status(200).json({ message: "agent called successfully" });
  } catch (error) {
    console.log("error", error.message);
    res
      .status(500)
      .json({ message: "agent not called check the functionality" });
  }
};
