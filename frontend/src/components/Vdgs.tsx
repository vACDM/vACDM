import React, { useState, useEffect, useRef } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import dayjs from "dayjs";
import { Toast } from "primereact/toast";

import PilotService from "../services/PilotService";
import TimeUtils from "../utils/time";
import Pilot from "@shared/interfaces/pilot.interface";
import User from "@shared/interfaces/user.interface";
import { Card } from "primereact/card";
import { InputText } from "primereact/inputtext";
import { Button } from "primereact/button";
import VdgsService from "services/VdgsService";
import AuthService from "services/AuthService";
import DatafeedService from "services/DatafeedService";

const Vdgs = () => {
  const navigate = useNavigate();
  const { callsign } = useParams();

  const [pilot, setPilot] = useState<Pilot | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [loadingTobt, setLoadingTobt] = useState(false);
  const [inputTextValue, setinputTextValue] = useState("");
  const [validity, setValidity] = useState("");
  const [wrongFormat, setwrongFormat] = useState("");
  const toast: any = useRef(null);

  useEffect(() => {
    setwrongFormat("");
    setValidity("");
    async function loadData() {
      await checkPilot();
    }

    loadData();
    let intervalId = setInterval(loadData, 10000);

    return () => clearInterval(intervalId);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function checkPilot() {
    try {
      const user: User = await AuthService.getProfile();

      const pilot: Pilot = await DatafeedService.getPilotFromCid(
        user.apidata.cid
      );

      setPilot(pilot);
      setLoading(false);
    } catch (e) {}
  }

  const showInfo = () => {
    toast.current.show({
      severity: "info",
      summary: "No Callsign found",
      detail: "Trying again in 10 sec.",
      life: 3000,
    });
  };

  function vdgsColorController(time: Date | undefined) {
    let now = dayjs().second(0);
    let tsat = dayjs(time).second(0);
    return now.diff(tsat, "minute") > 5 ? "textColorRed" : "";
  }

  function buttonDisabled(time: Date | undefined) {
    let now = dayjs().second(0);
    let tobt = dayjs(time).second(0);
    console.log(now.diff(tobt, "minute"));

    return now.diff(tobt, "minute") >= -10 ? true : false;
  }

  async function updateTobt() {
    let p = pilot;
    if (p) {
      p.vacdm.tobt = dayjs(TimeUtils.formatVdgsTobt(inputTextValue)).toDate();
      p.vacdm.tsat = dayjs(-1).toDate();
    }

    let regex = new RegExp("^(0[0-9]|1[0-9]|2[0-3])[0-5][0-9]$");
    if (regex.test(inputTextValue)) {
      setLoadingTobt(true);
      setPilot(p);
      setwrongFormat("");
      setValidity("");
      setinputTextValue(inputTextValue);
      await VdgsService.updateTobt(inputTextValue, callsign)
        .then(() => {
          setLoadingTobt(false);
          setinputTextValue("");
        })
        .catch(() => {
          setwrongFormat("Unauthorized!");
          setLoadingTobt(false);
        });
    } else {
      setValidity("p-invalid");
      setwrongFormat("Allowed Format: HHMM");
    }
  }

  return (
    <>
      <Toast ref={toast} />
      <div className="grid m-2">
        <div className="lg:col"></div>
        <div className="lg:col md:col-6">
          <div className="vdgs-container text-center">
            {loading ? (
              <div>
                SEARCHING FOR <br />
                CALLSIGN...
              </div>
            ) : (
              <div className="flex align-items-center justify-content-center">
                <div className="inline-block m-2">
                  <div className="text-center">{pilot?.callsign}</div>
                  <div className="text-center">
                    TOBT {TimeUtils.formatTime(pilot?.vacdm.tobt)} UTC
                  </div>
                  <div className="text-center">
                    TSAT {TimeUtils.formatTime(pilot?.vacdm.tsat)} UTC
                  </div>
                  <div className="text-center">
                    <span className={vdgsColorController(pilot?.vacdm?.tsat)}>
                      {TimeUtils.calculateVdgsDiff(pilot?.vacdm?.tsat)}
                    </span>
                  </div>
                  <div className="text-center">
                    PLANNED RWY {pilot?.clearance?.dep_rwy}
                  </div>
                  <div className="text-center">SID {pilot?.clearance?.sid}</div>
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="lg:col md:col-6">
          <Card>
            <h5>Update TOBT (UTC-Time when ready for Pushback)</h5>
            <div className="flex flex-wrap gap-2">
              <div className="">
                <InputText
                  className={validity}
                  placeholder="HHMM"
                  value={inputTextValue}
                  onChange={(e) => setinputTextValue(e.target.value)}
                  aria-describedby="tobt-help"
                ></InputText>
                <small id="tobt-help" className="block">
                  {wrongFormat}
                </small>
              </div>
              <Button
                label="Submit TOBT"
                className=""
                loading={loadingTobt}
                onClick={updateTobt}
                disabled={!callsign || callsign === "" ? true : false}
              ></Button>
            </div>
          </Card>
        </div>
      </div>
    </>
  );
};

export default Vdgs;
